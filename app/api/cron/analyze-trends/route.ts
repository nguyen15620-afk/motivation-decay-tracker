/**
 * API Route: /api/cron/analyze-trends
 * Methods: GET, POST
 * Description: Background cron runner (triggered by Vercel Cron or scheduled ping).
 * Iterates through all active projects, computes sliding-window linear regression,
 * records trend flags, and triggers smart interventions for projects suffering
 * from motivation decay or high volatility.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getProjects,
  getCheckins,
  createTrendFlag,
  getInterventions,
  createIntervention,
} from '@/lib/supabase/queries';
import { analyzeProjectTrend } from '@/lib/trend/regression';
import { evaluateAndGenerateIntervention } from '@/lib/interventions/generate';

export async function GET(req: NextRequest) {
  return handleCronTrendAnalysis();
}

export async function POST(req: NextRequest) {
  return handleCronTrendAnalysis();
}

async function handleCronTrendAnalysis() {
  const timestamp = new Date().toISOString();
  console.log(`[CRON /api/cron/analyze-trends] Starting automated scan at ${timestamp}...`);

  try {
    const projects = await getProjects();
    const activeProjects = projects.filter((p) => p.status === 'active');

    let flagsCreated = 0;
    let interventionsCreated = 0;
    const summaryDetails: Array<{
      projectId: string;
      projectName: string;
      flagType: string;
      slope: number;
      interventionTriggered: boolean;
    }> = [];

    for (const project of activeProjects) {
      const checkins = await getCheckins(project.id);
      const trendAnalysis = analyzeProjectTrend(project.id, checkins);

      // 1. Record trend flag
      await createTrendFlag({
        project_id: project.id,
        window_start: trendAnalysis.windowStart,
        window_end: trendAnalysis.windowEnd,
        slope: trendAnalysis.slope,
        flag_type: trendAnalysis.flagType,
        confidence: trendAnalysis.rSquared,
      });
      flagsCreated++;

      // 2. Evaluate smart intervention with cooldown safeguards
      const existingInterventions = await getInterventions(project.id);
      const latestIntervention = existingInterventions[0] || null;

      // Get latest context note from checkins
      const sorted = [...checkins].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latestNote = sorted[0]?.context_note || null;

      const candidate = evaluateAndGenerateIntervention({
        projectId: project.id,
        projectName: project.name,
        trendAnalysis,
        lastIntervention: latestIntervention,
        recentInterventions: existingInterventions,
        latestContextNote: latestNote,
        recentAverageEnergy: trendAnalysis.recentAverageEnergy,
      });

      let interventionCreated = false;
      if (candidate.shouldIntervene && candidate.suggestionType && candidate.message) {
        await createIntervention({
          project_id: project.id,
          suggestion_type: candidate.suggestionType,
          message: candidate.message,
          template_id: candidate.templateId,
          tone: candidate.tone,
          action_step: candidate.actionStep,
          user_response: null,
        });
        interventionsCreated++;
        interventionCreated = true;
      }

      summaryDetails.push({
        projectId: project.id,
        projectName: project.name,
        flagType: trendAnalysis.flagType,
        slope: trendAnalysis.slope,
        interventionTriggered: interventionCreated,
      });
    }

    return NextResponse.json({
      success: true,
      scannedAt: timestamp,
      totalActiveProjects: activeProjects.length,
      flagsCreated,
      interventionsCreated,
      summary: summaryDetails,
    });
  } catch (error: any) {
    console.error('[CRON /api/cron/analyze-trends] Error executing cron scan:', error);
    return NextResponse.json(
      { error: 'Lỗi thực thi quét xu hướng định kỳ', details: error?.message },
      { status: 500 }
    );
  }
}
