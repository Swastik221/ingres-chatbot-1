import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { groundwaterAssessments, regions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const type = searchParams.get('type');
    const regionId = searchParams.get('region_id');

    // Validate required parameters
    if (!format || !['json', 'csv'].includes(format)) {
      return NextResponse.json({ 
        error: "format parameter is required and must be 'json' or 'csv'",
        code: "INVALID_FORMAT" 
      }, { status: 400 });
    }

    if (!type || !['assessments', 'regions'].includes(type)) {
      return NextResponse.json({ 
        error: "type parameter is required and must be 'assessments' or 'regions'",
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    let data: any[] = [];

    if (type === 'assessments') {
      // Query groundwater assessments with regions join
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
        dataSource: groundwaterAssessments.dataSource,
        createdAt: groundwaterAssessments.createdAt,
        updatedAt: groundwaterAssessments.updatedAt
      })
      .from(groundwaterAssessments)
      .innerJoin(regions, eq(groundwaterAssessments.regionId, regions.id));

      if (regionId && !isNaN(parseInt(regionId))) {
        query = query.where(eq(groundwaterAssessments.regionId, parseInt(regionId)));
      }

      data = await query;
    } else if (type === 'regions') {
      // Query regions table only
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

      if (regionId && !isNaN(parseInt(regionId))) {
        query = query.where(eq(regions.id, parseInt(regionId)));
      }

      data = await query;
    }

    if (format === 'json') {
      return NextResponse.json(data, { status: 200 });
    } else if (format === 'csv') {
      if (data.length === 0) {
        return new NextResponse('', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${type}_export.csv"`
          }
        });
      }

      // Generate CSV headers from first object keys
      const headers = Object.keys(data[0]).join(',');
      
      // Generate CSV rows
      const rows = data.map(row => 
        Object.values(row).map(value => {
          // Handle null/undefined values and escape quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      );

      const csvContent = [headers, ...rows].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_export.csv"`
        }
      });
    }

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}