import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { historicalData, regions } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameter validation
    const regionId = searchParams.get('region_id');
    if (!regionId) {
      return NextResponse.json({
        error: 'region_id parameter is required',
        code: 'MISSING_REGION_ID'
      }, { status: 400 });
    }

    if (isNaN(parseInt(regionId))) {
      return NextResponse.json({
        error: 'region_id must be a valid integer',
        code: 'INVALID_REGION_ID'
      }, { status: 400 });
    }

    // Optional parameters
    const startYear = searchParams.get('start_year');
    const endYear = searchParams.get('end_year');
    const parameterType = searchParams.get('parameter_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate year parameters if provided
    if (startYear && isNaN(parseInt(startYear))) {
      return NextResponse.json({
        error: 'start_year must be a valid integer',
        code: 'INVALID_START_YEAR'
      }, { status: 400 });
    }

    if (endYear && isNaN(parseInt(endYear))) {
      return NextResponse.json({
        error: 'end_year must be a valid integer', 
        code: 'INVALID_END_YEAR'
      }, { status: 400 });
    }

    // Validate parameter_type if provided
    const validParameterTypes = ['recharge', 'extraction', 'water_level', 'quality'];
    if (parameterType && !validParameterTypes.includes(parameterType)) {
      return NextResponse.json({
        error: `parameter_type must be one of: ${validParameterTypes.join(', ')}`,
        code: 'INVALID_PARAMETER_TYPE'
      }, { status: 400 });
    }

    // First check if region exists
    const region = await db.select({
      id: regions.id,
      name: regions.name
    })
    .from(regions)
    .where(eq(regions.id, parseInt(regionId)))
    .limit(1);

    if (region.length === 0) {
      return NextResponse.json({
        error: 'Region not found',
        code: 'REGION_NOT_FOUND'
      }, { status: 404 });
    }

    // Build query conditions
    let conditions = [eq(historicalData.regionId, parseInt(regionId))];

    if (startYear) {
      conditions.push(gte(historicalData.year, parseInt(startYear)));
    }

    if (endYear) {
      conditions.push(lte(historicalData.year, parseInt(endYear)));
    }

    if (parameterType) {
      conditions.push(eq(historicalData.parameterType, parameterType));
    }

    // Execute query with joins
    const historicalDataPoints = await db.select({
      year: historicalData.year,
      month: historicalData.month,
      parameterType: historicalData.parameterType,
      value: historicalData.value,
      unit: historicalData.unit,
      regionId: historicalData.regionId,
      regionName: regions.name
    })
    .from(historicalData)
    .innerJoin(regions, eq(historicalData.regionId, regions.id))
    .where(and(...conditions))
    .orderBy(desc(historicalData.year), desc(historicalData.month))
    .limit(limit)
    .offset(offset);

    // Format response
    const response = {
      region: {
        id: region[0].id,
        name: region[0].name
      },
      data: historicalDataPoints.map(item => ({
        year: item.year,
        month: item.month,
        parameterType: item.parameterType,
        value: item.value,
        unit: item.unit
      }))
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}