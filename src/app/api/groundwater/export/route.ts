import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { regions, groundwaterAssessments, historicalData } from '@/db/schema';
import { eq, and, gte, lte, inArray, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Required parameters
    const format = searchParams.get('format');
    const dataType = searchParams.get('data_type');
    
    // Optional filters
    const regionIds = searchParams.get('region_ids');
    const startYear = searchParams.get('start_year');
    const endYear = searchParams.get('end_year');
    const stage = searchParams.get('stage');
    
    // Validate required parameters
    if (!format) {
      return NextResponse.json({ 
        error: "Format parameter is required",
        code: "MISSING_FORMAT" 
      }, { status: 400 });
    }
    
    if (!dataType) {
      return NextResponse.json({ 
        error: "Data type parameter is required",
        code: "MISSING_DATA_TYPE" 
      }, { status: 400 });
    }
    
    // Validate format
    const validFormats = ['csv', 'json', 'excel'];
    if (!validFormats.includes(format)) {
      return NextResponse.json({ 
        error: "Invalid format. Must be one of: csv, json, excel",
        code: "INVALID_FORMAT" 
      }, { status: 400 });
    }
    
    // Validate data_type
    const validDataTypes = ['assessments', 'historical', 'regions', 'critical'];
    if (!validDataTypes.includes(dataType)) {
      return NextResponse.json({ 
        error: "Invalid data type. Must be one of: assessments, historical, regions, critical",
        code: "INVALID_DATA_TYPE" 
      }, { status: 400 });
    }
    
    // Parse region_ids if provided
    let regionIdArray: number[] = [];
    if (regionIds) {
      try {
        regionIdArray = regionIds.split(',').map(id => {
          const parsed = parseInt(id.trim());
          if (isNaN(parsed)) {
            throw new Error(`Invalid region ID: ${id}`);
          }
          return parsed;
        });
      } catch (error) {
        return NextResponse.json({ 
          error: "Invalid region IDs format. Must be comma-separated integers",
          code: "INVALID_REGION_IDS" 
        }, { status: 400 });
      }
    }
    
    // Parse year range if provided
    let startYearNum: number | undefined;
    let endYearNum: number | undefined;
    
    if (startYear) {
      startYearNum = parseInt(startYear);
      if (isNaN(startYearNum) || startYearNum < 1900 || startYearNum > new Date().getFullYear() + 10) {
        return NextResponse.json({ 
          error: "Invalid start year",
          code: "INVALID_START_YEAR" 
        }, { status: 400 });
      }
    }
    
    if (endYear) {
      endYearNum = parseInt(endYear);
      if (isNaN(endYearNum) || endYearNum < 1900 || endYearNum > new Date().getFullYear() + 10) {
        return NextResponse.json({ 
          error: "Invalid end year",
          code: "INVALID_END_YEAR" 
        }, { status: 400 });
      }
    }
    
    if (startYearNum && endYearNum && startYearNum > endYearNum) {
      return NextResponse.json({ 
        error: "Start year cannot be greater than end year",
        code: "INVALID_YEAR_RANGE" 
      }, { status: 400 });
    }
    
    // Validate stage if provided
    if (stage) {
      const validStages = ['Safe', 'Semi-Critical', 'Critical', 'Over-Exploited'];
      if (!validStages.includes(stage)) {
        return NextResponse.json({ 
          error: "Invalid stage. Must be one of: Safe, Semi-Critical, Critical, Over-Exploited",
          code: "INVALID_STAGE" 
        }, { status: 400 });
      }
    }
    
    let data: any[] = [];
    let exportType = dataType;
    
    // Query data based on data_type
    switch (dataType) {
      case 'assessments':
        data = await queryAssessments(regionIdArray, startYearNum, endYearNum, stage);
        break;
        
      case 'historical':
        data = await queryHistorical(regionIdArray, startYearNum, endYearNum);
        break;
        
      case 'regions':
        data = await queryRegions(regionIdArray);
        break;
        
      case 'critical':
        data = await queryCritical(regionIdArray, startYearNum, endYearNum);
        exportType = 'critical_areas';
        break;
        
      default:
        return NextResponse.json({ 
          error: "Invalid data type",
          code: "INVALID_DATA_TYPE" 
        }, { status: 400 });
    }
    
    const timestamp = new Date().toISOString();
    const recordCount = data.length;
    
    // Format response based on requested format
    switch (format) {
      case 'json':
        return NextResponse.json({
          exportType,
          timestamp,
          recordCount,
          data
        });
        
      case 'csv':
        const csv = formatAsCSV(data, dataType);
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${exportType}_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
        
      case 'excel':
        // Note: For actual Excel file generation, additional libraries like xlsx would be needed
        return NextResponse.json({
          exportType,
          timestamp,
          recordCount,
          data,
          note: "For Excel format, use a client-side library to convert this JSON to Excel format"
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Export-Format': 'excel-json'
          }
        });
        
      default:
        return NextResponse.json({ 
          error: "Invalid format",
          code: "INVALID_FORMAT" 
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

async function queryAssessments(regionIds: number[], startYear?: number, endYear?: number, stage?: string) {
  let query = db.select({
    id: groundwaterAssessments.id,
    regionId: groundwaterAssessments.regionId,
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
  .leftJoin(regions, eq(groundwaterAssessments.regionId, regions.id));
  
  const conditions = [];
  
  if (regionIds.length > 0) {
    conditions.push(inArray(groundwaterAssessments.regionId, regionIds));
  }
  
  if (startYear) {
    conditions.push(gte(groundwaterAssessments.assessmentYear, startYear));
  }
  
  if (endYear) {
    conditions.push(lte(groundwaterAssessments.assessmentYear, endYear));
  }
  
  if (stage) {
    conditions.push(eq(groundwaterAssessments.stageOfExtraction, stage));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query.orderBy(desc(groundwaterAssessments.assessmentYear));
}

async function queryHistorical(regionIds: number[], startYear?: number, endYear?: number) {
  let query = db.select({
    id: historicalData.id,
    regionId: historicalData.regionId,
    regionName: regions.name,
    regionType: regions.type,
    regionCode: regions.code,
    year: historicalData.year,
    month: historicalData.month,
    parameterType: historicalData.parameterType,
    value: historicalData.value,
    unit: historicalData.unit
  })
  .from(historicalData)
  .leftJoin(regions, eq(historicalData.regionId, regions.id));
  
  const conditions = [];
  
  if (regionIds.length > 0) {
    conditions.push(inArray(historicalData.regionId, regionIds));
  }
  
  if (startYear) {
    conditions.push(gte(historicalData.year, startYear));
  }
  
  if (endYear) {
    conditions.push(lte(historicalData.year, endYear));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query.orderBy(desc(historicalData.year));
}

async function queryRegions(regionIds: number[]) {  
  let query = db.select({
    id: regions.id,
    name: regions.name,
    type: regions.type,
    parentId: regions.parentId,
    code: regions.code,
    latitude: regions.latitude,
    longitude: regions.longitude,
    createdAt: regions.createdAt,
    updatedAt: regions.updatedAt
  })
  .from(regions);
  
  if (regionIds.length > 0) {
    query = query.where(inArray(regions.id, regionIds));
  }
  
  return await query.orderBy(regions.name);
}

async function queryCritical(regionIds: number[], startYear?: number, endYear?: number) {
  let query = db.select({
    id: groundwaterAssessments.id,
    regionId: groundwaterAssessments.regionId,
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
  .leftJoin(regions, eq(groundwaterAssessments.regionId, regions.id));
  
  const conditions = [
    inArray(groundwaterAssessments.stageOfExtraction, ['Critical', 'Over-Exploited'])
  ];
  
  if (regionIds.length > 0) {
    conditions.push(inArray(groundwaterAssessments.regionId, regionIds));
  }
  
  if (startYear) {
    conditions.push(gte(groundwaterAssessments.assessmentYear, startYear));
  }
  
  if (endYear) {
    conditions.push(lte(groundwaterAssessments.assessmentYear, endYear));
  }
  
  query = query.where(and(...conditions));
  
  return await query.orderBy(desc(groundwaterAssessments.extractionRatio));
}

function formatAsCSV(data: any[], dataType: string): string {
  if (data.length === 0) {
    return '';
  }
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeaders = headers.join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      // Escape commas and quotes in values
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}