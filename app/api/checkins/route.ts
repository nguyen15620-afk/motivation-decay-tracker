/**
 * API Route: /api/checkins
 * Method: POST
 * Description: Records a new motivation/energy check-in, automatically updates
 * trend evaluation, and checks if an immediate smart intervention should be triggered.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCheckin, getCheckins, getProjectById, getInterventions, createTrendFlag, createIntervention } from '@/lib/supabase/queries';
import { analyzeProjectTrend } from '@/lib/trend/regression';
import { evaluateAndGenerateInterventionAsync } from '@/lib/interventions/generate';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, score, energy, context_note } = body;

    // 1. Validation
    if (!project_id) {
      return NextResponse.json(
        { error: 'Thiếu thông tin project_id bắt buộc' },
        { status: 400 }
      );
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 1 || numScore > 10) {
      return NextResponse.json(
        { error: 'Điểm động lực (score) phải là số nguyên từ 1 đến 10' },
        { status: 400 }
      );
    }

    const numEnergy = energy !== undefined && energy !== null && energy !== '' ? Number(energy) : null;
    if (numEnergy !== null && (isNaN(numEnergy) || numEnergy < 1 || numEnergy > 10)) {
      return NextResponse.json(
        { error: 'Điểm năng lượng (energy) phải từ 1 đến 10 nếu được cung cấp' },
        { status: 400 }
      );
    }

    // 2. Fetch project details
    const project = await getProjectById(project_id);
    if (!project) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án tương ứng' },
        { status: 404 }
      );
    }

    // 3. Persist new checkin
    const newCheckin = await createCheckin({
      project_id,
      score: numScore,
      energy: numEnergy,
      context_note: context_note?.trim() || null,
    });

    // 4. Recalculate trend with the newly added check-in
    const allCheckins = await getCheckins(project_id);
    const trendAnalysis = analyzeProjectTrend(project_id, allCheckins);

    // Save trend flag snapshot
    const trendFlag = await createTrendFlag({
      project_id,
      window_start: trendAnalysis.windowStart,
      window_end: trendAnalysis.windowEnd,
      slope: trendAnalysis.slope,
      flag_type: trendAnalysis.flagType,
      confidence: trendAnalysis.rSquared,
    });

    // 5. Check if smart intervention is warranted (with BYOK header support)
    const existingInterventions = await getInterventions(project_id);
    const latestIntervention = existingInterventions[0] || null;
    const clientApiKey = req.headers.get('x-gemini-api-key') || undefined;

    const interventionCandidate = await evaluateAndGenerateInterventionAsync({
      projectId: project_id,
      projectName: project.name,
      trendAnalysis,
      lastIntervention: latestIntervention,
      recentInterventions: existingInterventions,
      latestContextNote: context_note,
      recentAverageEnergy: trendAnalysis.recentAverageEnergy,
      checkins: allCheckins,
      userProvidedApiKey: clientApiKey,
      enableAI: true,
    });

    let createdIntervention = null;
    if (interventionCandidate.shouldIntervene && interventionCandidate.suggestionType && interventionCandidate.message) {
      createdIntervention = await createIntervention({
        project_id,
        trend_flag_id: trendFlag.id,
        suggestion_type: interventionCandidate.suggestionType,
        message: interventionCandidate.message,
        template_id: interventionCandidate.templateId,
        tone: interventionCandidate.tone,
        action_step: interventionCandidate.actionStep,
        user_response: null,
      });
    }

    return NextResponse.json({
      success: true,
      checkin: newCheckin,
      trendAnalysis,
      intervention: createdIntervention,
    });
  } catch (error: any) {
    console.error('[API /api/checkins] Error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ khi xử lý check-in', details: error?.message },
      { status: 500 }
    );
  }
}
