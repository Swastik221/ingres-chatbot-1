import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { regions, groundwaterAssessments, historicalData } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

interface QueryContext {
  location?: string;
  region?: string;
  timeframe?: string;
  [key: string]: any;
}

interface ChatRequest {
  query: string;
  context?: QueryContext;
}

interface QueryResult {
  query: string;
  response: {
    type: string;
    region?: string;
    data: any;
    summary: string;
  };
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { query, context } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        error: "Query is required and must be a string",
        code: "MISSING_REQUIRED_FIELD"
      }, { status: 400 });
    }

    if (query.trim().length === 0) {
      return NextResponse.json({
        error: "Query cannot be empty",
        code: "INVALID_QUERY"
      }, { status: 400 });
    }

    // Parse query to determine intent and extract region
    const queryLower = query.toLowerCase();
    const regionName = extractRegionFromQuery(queryLower, context);

    if (!regionName) {
      return NextResponse.json({
        error: "Could not identify a region in your query. Please specify a state, district, or region.",
        code: "REGION_NOT_FOUND"
      }, { status: 400 });
    }

    // Find region in database
    const region = await db.select()
      .from(regions)
      .where(like(regions.name, `%${regionName}%`))
      .limit(1);

    if (region.length === 0) {
      return NextResponse.json({
        error: `Region '${regionName}' not found in database`,
        code: "REGION_NOT_FOUND"
      }, { status: 404 });
    }

    const foundRegion = region[0];

    // Determine query type and fetch appropriate data
    let response: QueryResult['response'];

    if (queryLower.includes('status') || queryLower.includes('assessment') || queryLower.includes('current')) {
      response = await handleAssessmentQuery(foundRegion, query);
    } else if (queryLower.includes('historical') || queryLower.includes('trend') || queryLower.includes('over time')) {
      response = await handleHistoricalQuery(foundRegion, query);
    } else if (queryLower.includes('critical') || queryLower.includes('over-exploited') || queryLower.includes('safe')) {
      response = await handleCriticalAreasQuery(foundRegion, query);
    } else {
      // Default to latest assessment data
      response = await handleAssessmentQuery(foundRegion, query);
    }

    const result: QueryResult = {
      query,
      response,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

function extractRegionFromQuery(query: string, context?: QueryContext): string | null {
  // Check context first
  if (context?.location) {
    return context.location;
  }
  if (context?.region) {
    return context.region;
  }

  // Common Indian states and regions
  const regions = [
    'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
    'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
    'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
    'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu',
    'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal',
    'delhi', 'mumbai', 'bangalore', 'chennai', 'hyderabad', 'kolkata', 'pune'
  ];

  for (const region of regions) {
    if (query.includes(region)) {
      return region;
    }
  }

  // Extract potential region names using simple patterns
  const patterns = [
    /in\s+([a-zA-Z\s]+?)(?:\s|$|[?.,])/,
    /for\s+([a-zA-Z\s]+?)(?:\s|$|[?.,])/,
    /of\s+([a-zA-Z\s]+?)(?:\s|$|[?.,])/
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted.length > 2 && extracted.length < 30) {
        return extracted;
      }
    }
  }

  return null;
}

async function handleAssessmentQuery(region: any, query: string) {
  const assessment = await db.select()
    .from(groundwaterAssessments)
    .where(eq(groundwaterAssessments.regionId, region.id))
    .orderBy(desc(groundwaterAssessments.assessmentYear))
    .limit(1);

  if (assessment.length === 0) {
    return {
      type: "no_data",
      region: region.name,
      data: {},
      summary: `No groundwater assessment data available for ${region.name}.`
    };
  }

  const data = assessment[0];
  return {
    type: "assessment_data",
    region: region.name,
    data: {
      stageOfExtraction: data.stageOfExtraction,
      extractionRatio: data.extractionRatio,
      trend: data.trend,
      year: data.assessmentYear,
      annualRecharge: data.annualRecharge,
      totalExtraction: data.totalExtraction,
      extractableResources: data.extractableResources
    },
    summary: `${region.name} has ${data.stageOfExtraction} groundwater extraction levels with ${data.extractionRatio}% extraction ratio and ${data.trend.toLowerCase()} trend as of ${data.assessmentYear}.`
  };
}

async function handleHistoricalQuery(region: any, query: string) {
  const historical = await db.select()
    .from(historicalData)
    .where(eq(historicalData.regionId, region.id))
    .orderBy(desc(historicalData.year))
    .limit(10);

  if (historical.length === 0) {
    return {
      type: "no_data",
      region: region.name,
      data: {},
      summary: `No historical groundwater data available for ${region.name}.`
    };
  }

  const data = historical.map(record => ({
    year: record.year,
    month: record.month,
    parameterType: record.parameterType,
    value: record.value,
    unit: record.unit
  }));

  return {
    type: "historical_data",
    region: region.name,
    data: {
      records: data,
      totalRecords: historical.length
    },
    summary: `Found ${historical.length} historical data records for ${region.name} covering various groundwater parameters.`
  };
}

async function handleCriticalAreasQuery(region: any, query: string) {
  const assessments = await db.select()
    .from(groundwaterAssessments)
    .where(eq(groundwaterAssessments.regionId, region.id))
    .orderBy(desc(groundwaterAssessments.assessmentYear));

  if (assessments.length === 0) {
    return {
      type: "no_data",
      region: region.name,
      data: {},
      summary: `No assessment data available to determine critical status for ${region.name}.`
    };
  }

  const criticalAssessments = assessments.filter(a => 
    a.stageOfExtraction === 'Critical' || 
    a.stageOfExtraction === 'Over-Exploited' ||
    a.stageOfExtraction === 'Semi-Critical'
  );

  const latestAssessment = assessments[0];
  const isCritical = criticalAssessments.length > 0;

  return {
    type: "critical_status",
    region: region.name,
    data: {
      isCritical,
      currentStatus: latestAssessment.stageOfExtraction,
      extractionRatio: latestAssessment.extractionRatio,
      criticalYears: criticalAssessments.map(a => ({
        year: a.assessmentYear,
        status: a.stageOfExtraction,
        extractionRatio: a.extractionRatio
      }))
    },
    summary: isCritical 
      ? `${region.name} has critical groundwater conditions with current status: ${latestAssessment.stageOfExtraction} (${latestAssessment.extractionRatio}% extraction).`
      : `${region.name} currently has ${latestAssessment.stageOfExtraction} groundwater status with ${latestAssessment.extractionRatio}% extraction ratio.`
  };
}