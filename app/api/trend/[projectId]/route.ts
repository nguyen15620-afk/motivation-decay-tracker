/**
 * API Route: /api/trend/[projectId]
 * Method: GET
 * Description: Returns current motivation trend analysis, regression metrics (slope, R^2),
 * historical trendline data for charting, and logged interventions for the specified project.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCheckins, getProjectById, getInterventions, getTrendFlags } from '@/lib/supabase/queries';
import { analyzeProjectTrend } from '@/lib/trend/regression';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Thiếu projectId trong đường dẫn' },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án tương ứng' },
        { status: 404 }
      );
    }

    // Retrieve all checkins for the project
    const checkins = await getCheckins(projectId);

    // Compute trend analysis via regression engine
    const trendAnalysis = analyzeProjectTrend(projectId, checkins);

    // Retrieve historical interventions and trend flags
    const interventions = await getInterventions(projectId);
    const trendFlags = await getTrendFlags(projectId);

    return NextResponse.json({
      success: true,
      project,
      trendAnalysis,
      interventions,
      trendFlags,
    });
  } catch (error: any) {
    console.error('[API /api/trend/[projectId]] Error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi phân tích xu hướng', details: error?.message },
      { status: 500 }
    );
  }
}
