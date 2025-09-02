import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { regions, groundwaterAssessments } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const regionId = searchParams.get('region_id');
    const regionType = searchParams.get('region_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate region_id if provided
    if (regionId && isNaN(parseInt(regionId))) {
      return NextResponse.json({ 
        error: "Invalid region_id. Must be a valid integer",
        code: "INVALID_REGION_ID" 
      }, { status: 400 });
    }

    // Validate region_type if provided
    const validRegionTypes = ['state', 'district', 'block', 'mandal', 'taluk'];
    if (regionType && !validRegionTypes.includes(regionType)) {
      return NextResponse.json({ 
        error: `Invalid region_type. Must be one of: ${validRegionTypes.join(', ')}`,
        code: "INVALID_REGION_TYPE" 
      }, { status: 400 });
    }

    // Validate pagination parameters
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ 
        error: "Invalid limit parameter. Must be a positive integer",
        code: "INVALID_LIMIT" 
      }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ 
        error: "Invalid offset parameter. Must be a non-negative integer",
        code: "INVALID_OFFSET" 
      }, { status: 400 });
    }

    // Build the query to get latest assessment for each region
    // First, create a subquery to get the maximum assessment year for each region
    const latestYearSubquery = db
      .select({
        regionId: groundwaterAssessments.regionId,
        maxYear: sql`MAX(${groundwaterAssessments.assessmentYear})`.as('maxYear')
      })
      .from(groundwaterAssessments)
      .groupBy(groundwaterAssessments.regionId)
      .as('latest_years');

    // Main query joining regions with their latest assessments
    let query = db
      .select({
        regionId: regions.id,
        regionName: regions.name,
        regionType: regions.type,
        regionCode: regions.code,
        regionLatitude: regions.latitude,
        regionLongitude: regions.longitude,
        assessmentId: groundwaterAssessments.id,
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
      .from(regions)
      .innerJoin(
        groundwaterAssessments,
        eq(regions.id, groundwaterAssessments.regionId)
      )
      .innerJoin(
        latestYearSubquery,
        and(
          eq(groundwaterAssessments.regionId, latestYearSubquery.regionId),
          eq(groundwaterAssessments.assessmentYear, latestYearSubquery.maxYear)
        )
      );

    // Apply filters
    const conditions = [];
    
    if (regionId) {
      conditions.push(eq(regions.id, parseInt(regionId)));
    }
    
    if (regionType) {
      conditions.push(eq(regions.type, regionType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering and pagination
    const results = await query
      .orderBy(desc(groundwaterAssessments.assessmentYear), regions.name)
      .limit(limit)
      .offset(offset);

    // Transform results to match the required response format
    const transformedResults = results.map(row => ({
      region: {
        id: row.regionId,
        name: row.regionName,
        type: row.regionType,
        code: row.regionCode,
        latitude: row.regionLatitude,
        longitude: row.regionLongitude
      },
      assessment: {
        year: row.assessmentYear,
        annualRecharge: row.annualRecharge,
        extractableResources: row.extractableResources,
        totalExtraction: row.totalExtraction,
        stageOfExtraction: row.stageOfExtraction,
        extractionRatio: row.extractionRatio,
        trend: row.trend,
        assessmentDate: row.assessmentDate,
        dataSource: row.dataSource
      }
    }));

    return NextResponse.json(transformedResults, { status: 200 });

  } catch (error) {
    console.error('GET groundwater assessments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}