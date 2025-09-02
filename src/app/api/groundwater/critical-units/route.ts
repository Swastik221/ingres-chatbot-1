import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { regions, groundwaterAssessments } from '@/db/schema';
import { eq, and, or, desc, inArray, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const stageParam = searchParams.get('stage') || 'Critical,Over-Exploited';
    const stateIdParam = searchParams.get('state_id');
    const limitParam = searchParams.get('limit') || '50';
    const offsetParam = searchParams.get('offset') || '0';

    // Validate and parse limit (max 200)
    const limit = Math.min(parseInt(limitParam), 200);
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ 
        error: "Limit must be a positive integer (max 200)",
        code: "INVALID_LIMIT" 
      }, { status: 400 });
    }

    // Validate and parse offset
    const offset = parseInt(offsetParam);
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ 
        error: "Offset must be a non-negative integer",
        code: "INVALID_OFFSET" 
      }, { status: 400 });
    }

    // Parse and validate stages
    const validStages = ['Critical', 'Over-Exploited', 'Semi-Critical'];
    const stages = stageParam.split(',').map(s => s.trim()).filter(s => s);
    
    for (const stage of stages) {
      if (!validStages.includes(stage)) {
        return NextResponse.json({ 
          error: `Invalid stage: ${stage}. Valid stages are: ${validStages.join(', ')}`,
          code: "INVALID_STAGE" 
        }, { status: 400 });
      }
    }

    if (stages.length === 0) {
      return NextResponse.json({ 
        error: "At least one valid stage must be specified",
        code: "NO_VALID_STAGES" 
      }, { status: 400 });
    }

    // Validate state_id if provided
    let stateId: number | null = null;
    if (stateIdParam) {
      stateId = parseInt(stateIdParam);
      if (isNaN(stateId)) {
        return NextResponse.json({ 
          error: "State ID must be a valid integer",
          code: "INVALID_STATE_ID" 
        }, { status: 400 });
      }

      // Verify state exists
      const stateExists = await db.select({ id: regions.id })
        .from(regions)
        .where(eq(regions.id, stateId))
        .limit(1);

      if (stateExists.length === 0) {
        return NextResponse.json({ 
          error: "State not found",
          code: "STATE_NOT_FOUND" 
        }, { status: 404 });
      }
    }

    // Build the main query to get latest assessments with region data
    const latestAssessmentsSubquery = db
      .select({
        regionId: groundwaterAssessments.regionId,
        maxYear: sql<number>`MAX(${groundwaterAssessments.assessmentYear})`.as('maxYear')
      })
      .from(groundwaterAssessments)
      .groupBy(groundwaterAssessments.regionId)
      .as('latest');

    // Base query with joins
    let baseQuery = db
      .select({
        regionId: regions.id,
        regionName: regions.name,
        regionType: regions.type,
        regionCode: regions.code,
        parentId: regions.parentId,
        assessmentYear: groundwaterAssessments.assessmentYear,
        stageOfExtraction: groundwaterAssessments.stageOfExtraction,
        extractionRatio: groundwaterAssessments.extractionRatio,
        totalExtraction: groundwaterAssessments.totalExtraction,
        annualRecharge: groundwaterAssessments.annualRecharge,
        trend: groundwaterAssessments.trend
      })
      .from(regions)
      .innerJoin(groundwaterAssessments, eq(regions.id, groundwaterAssessments.regionId))
      .innerJoin(
        latestAssessmentsSubquery,
        and(
          eq(groundwaterAssessments.regionId, latestAssessmentsSubquery.regionId),
          eq(groundwaterAssessments.assessmentYear, latestAssessmentsSubquery.maxYear)
        )
      )
      .where(inArray(groundwaterAssessments.stageOfExtraction, stages));

    // Apply state filter if provided
    if (stateId) {
      baseQuery = baseQuery.where(
        and(
          inArray(groundwaterAssessments.stageOfExtraction, stages),
          or(
            eq(regions.id, stateId),
            eq(regions.parentId, stateId)
          )
        )
      );
    }

    // Execute query with ordering and pagination
    const results = await baseQuery
      .orderBy(desc(groundwaterAssessments.extractionRatio))
      .limit(limit)
      .offset(offset);

    // Get parent state information for each region
    const regionIds = results.map(r => r.parentId).filter(Boolean) as number[];
    const parentStates = regionIds.length > 0 
      ? await db.select({
          id: regions.id,
          name: regions.name,
          type: regions.type
        })
        .from(regions)
        .where(inArray(regions.id, regionIds))
      : [];

    const parentStateMap = new Map(parentStates.map(s => [s.id, s]));

    // Transform results to required format
    const criticalUnits = results.map(result => ({
      region: {
        id: result.regionId,
        name: result.regionName,
        type: result.regionType,
        state: result.parentId ? parentStateMap.get(result.parentId)?.name || 'Unknown' : result.regionName,
        code: result.regionCode
      },
      assessment: {
        year: result.assessmentYear,
        stageOfExtraction: result.stageOfExtraction,
        extractionRatio: result.extractionRatio,
        totalExtraction: result.totalExtraction,
        annualRecharge: result.annualRecharge,
        trend: result.trend
      }
    }));

    // Get summary counts
    const summaryQuery = db
      .select({
        stageOfExtraction: groundwaterAssessments.stageOfExtraction,
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(regions)
      .innerJoin(groundwaterAssessments, eq(regions.id, groundwaterAssessments.regionId))
      .innerJoin(
        latestAssessmentsSubquery,
        and(
          eq(groundwaterAssessments.regionId, latestAssessmentsSubquery.regionId),
          eq(groundwaterAssessments.assessmentYear, latestAssessmentsSubquery.maxYear)
        )
      )
      .where(inArray(groundwaterAssessments.stageOfExtraction, ['Critical', 'Over-Exploited']))
      .groupBy(groundwaterAssessments.stageOfExtraction);

    // Apply state filter to summary if provided
    const summaryResults = stateId 
      ? await summaryQuery.where(
          and(
            inArray(groundwaterAssessments.stageOfExtraction, ['Critical', 'Over-Exploited']),
            or(
              eq(regions.id, stateId),
              eq(regions.parentId, stateId)
            )
          )
        )
      : await summaryQuery;

    const summary = {
      totalCritical: summaryResults.find(s => s.stageOfExtraction === 'Critical')?.count || 0,
      totalOverExploited: summaryResults.find(s => s.stageOfExtraction === 'Over-Exploited')?.count || 0
    };

    return NextResponse.json({
      criticalUnits,
      summary
    });

  } catch (error) {
    console.error('GET critical areas error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}