import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { regions, groundwaterAssessments } from '@/db/schema';
import { eq, and, or, inArray, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionIdsParam = searchParams.get('region_ids');
    const year = searchParams.get('year');
    const parametersParam = searchParams.get('parameters');

    // Validate required region_ids parameter
    if (!regionIdsParam) {
      return NextResponse.json({ 
        error: "region_ids parameter is required",
        code: "MISSING_REGION_IDS" 
      }, { status: 400 });
    }

    // Parse and validate region_ids
    const regionIds = regionIdsParam.split(',').map(id => {
      const parsedId = parseInt(id.trim());
      if (isNaN(parsedId)) {
        throw new Error(`Invalid region ID: ${id}`);
      }
      return parsedId;
    });

    if (regionIds.length === 0) {
      return NextResponse.json({ 
        error: "At least one valid region ID is required",
        code: "INVALID_REGION_IDS" 
      }, { status: 400 });
    }

    // Parse parameters filter
    const validParameters = ['recharge', 'extraction', 'stage', 'trend'];
    let requestedParameters = validParameters; // default: all
    
    if (parametersParam) {
      const paramList = parametersParam.split(',').map(p => p.trim());
      const invalidParams = paramList.filter(p => !validParameters.includes(p));
      
      if (invalidParams.length > 0) {
        return NextResponse.json({ 
          error: `Invalid parameters: ${invalidParams.join(', ')}. Valid parameters: ${validParameters.join(', ')}`,
          code: "INVALID_PARAMETERS" 
        }, { status: 400 });
      }
      
      requestedParameters = paramList;
    }

    // Determine the year to use for comparison
    let comparisonYear: number;
    
    if (year) {
      const parsedYear = parseInt(year);
      if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear()) {
        return NextResponse.json({ 
          error: "Invalid year format or year out of range",
          code: "INVALID_YEAR" 
        }, { status: 400 });
      }
      comparisonYear = parsedYear;
    } else {
      // Get the latest available year across all specified regions
      const latestYearResult = await db
        .select({ maxYear: sql<number>`MAX(${groundwaterAssessments.assessmentYear})` })
        .from(groundwaterAssessments)
        .where(inArray(groundwaterAssessments.regionId, regionIds))
        .limit(1);

      if (latestYearResult.length === 0 || !latestYearResult[0].maxYear) {
        return NextResponse.json({ 
          error: "No assessment data found for the specified regions",
          code: "NO_DATA_FOUND" 
        }, { status: 404 });
      }
      
      comparisonYear = latestYearResult[0].maxYear;
    }

    // Fetch assessment data with region details
    const assessmentData = await db
      .select({
        regionId: regions.id,
        regionName: regions.name,
        regionType: regions.type,
        regionCode: regions.code,
        assessmentYear: groundwaterAssessments.assessmentYear,
        annualRecharge: groundwaterAssessments.annualRecharge,
        extractableResources: groundwaterAssessments.extractableResources,
        totalExtraction: groundwaterAssessments.totalExtraction,
        stageOfExtraction: groundwaterAssessments.stageOfExtraction,
        extractionRatio: groundwaterAssessments.extractionRatio,
        trend: groundwaterAssessments.trend,
        assessmentDate: groundwaterAssessments.assessmentDate,
        dataSource: groundwaterAssessments.dataSource
      })
      .from(groundwaterAssessments)
      .innerJoin(regions, eq(groundwaterAssessments.regionId, regions.id))
      .where(
        and(
          inArray(groundwaterAssessments.regionId, regionIds),
          eq(groundwaterAssessments.assessmentYear, comparisonYear)
        )
      )
      .orderBy(regions.name);

    if (assessmentData.length === 0) {
      return NextResponse.json({ 
        error: `No assessment data found for the specified regions in year ${comparisonYear}`,
        code: "NO_DATA_FOR_YEAR" 
      }, { status: 404 });
    }

    // Check if any requested regions were not found
    const foundRegionIds = assessmentData.map(data => data.regionId);
    const missingRegionIds = regionIds.filter(id => !foundRegionIds.includes(id));
    
    if (missingRegionIds.length > 0) {
      console.warn(`No data found for region IDs: ${missingRegionIds.join(', ')} in year ${comparisonYear}`);
    }

    // Build response based on requested parameters
    const regions_data = assessmentData.map(data => {
      const region = {
        id: data.regionId,
        name: data.regionName,
        type: data.regionType,
        code: data.regionCode
      };

      const assessment: any = {};

      // Include parameters based on request
      if (requestedParameters.includes('recharge')) {
        assessment.annualRecharge = data.annualRecharge;
        assessment.extractableResources = data.extractableResources;
      }

      if (requestedParameters.includes('extraction')) {
        assessment.totalExtraction = data.totalExtraction;
        assessment.extractionRatio = data.extractionRatio;
      }

      if (requestedParameters.includes('stage')) {
        assessment.stageOfExtraction = data.stageOfExtraction;
      }

      if (requestedParameters.includes('trend')) {
        assessment.trend = data.trend;
      }

      // Always include metadata
      assessment.assessmentDate = data.assessmentDate;
      assessment.dataSource = data.dataSource;

      return {
        region,
        assessment
      };
    });

    const response = {
      comparisonYear,
      totalRegions: regions_data.length,
      requestedRegions: regionIds.length,
      missingRegions: missingRegionIds.length > 0 ? missingRegionIds : undefined,
      parameters: requestedParameters,
      regions: regions_data
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET error:', error);
    
    // Handle specific parsing errors
    if (error instanceof Error && error.message.includes('Invalid region ID')) {
      return NextResponse.json({ 
        error: error.message,
        code: "INVALID_REGION_ID_FORMAT" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}