/**
 * Motivation Decay Tracker - Early-Phase Warmup Engine
 * 
 * Solves the Cold-Start Gap for projects with < 5 check-ins.
 * Before statistical linear regression stabilizes, if early scores show friction
 * (e.g., average score <= 5.0 or sharp early drop), provides targeted kick-off momentum
 * guidance to prevent Day 1-7 onboarding churn.
 */

import { Checkin, InterventionTone, SuggestionType } from '../../supabase/types';

export interface EarlyPhaseWarmupParams {
  projectName: string;
  checkins: Checkin[];
}

export interface EarlyPhaseWarmupResult {
  shouldIntervene: boolean;
  suggestionType?: SuggestionType;
  message?: string;
  actionStep?: string;
  tone?: InterventionTone;
  templateId?: string;
  reason?: string;
}

/**
 * Evaluates early check-ins (< 5 data points) for early friction and provides kick-off coaching.
 */
export function evaluateEarlyPhaseWarmup({
  projectName,
  checkins,
}: EarlyPhaseWarmupParams): EarlyPhaseWarmupResult {
  const count = checkins.length;

  // Only active for cold-start projects (1 to 4 check-ins)
  if (count === 0 || count >= 5) {
    return { shouldIntervene: false };
  }

  // Sort chronologically
  const sorted = [...checkins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const scores = sorted.map((c) => c.score);
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / count;
  const latestScore = scores[scores.length - 1];
  const firstScore = scores[0];
  const dropFromStart = firstScore - latestScore;

  // Criteria for early intervention:
  // 1. Average score is low (<= 5.0)
  // 2. Or sharp early decline (drop >= 2.5 points from first check-in)
  // 3. Or latest score is severely low (<= 3.0)
  const isEarlyStruggle = avgScore <= 5.0 || dropFromStart >= 2.5 || latestScore <= 3.0;

  if (!isEarlyStruggle) {
    return {
      shouldIntervene: false,
      reason: 'Giai đoạn khởi động ổn định, điểm số đầu vào duy trì tích cực.',
    };
  }

  // Variant 1: Severe early struggle (latestScore <= 3 or drop >= 3)
  if (latestScore <= 3 || dropFromStart >= 3.0) {
    return {
      shouldIntervene: true,
      suggestionType: 'take_break',
      templateId: 'warmup_early_friction_reset',
      tone: 'compassionate',
      message: `Khởi đầu một dự án mới như "${projectName}" luôn là giai đoạn tiêu tốn nhiều năng lượng tinh thần nhất vì não bộ phải đối mặt với vô vàn điều chưa biết. Việc cảm thấy chững lại hoặc nản ngay trong những ngày đầu là phản ứng hoàn toàn bình thường, không phải dấu hiệu bạn thiếu năng lực. Hãy cho phép bản thân giảm nhịp một ngày để lấy lại sự thảnh thơi.`,
      actionStep: `Gấp máy tính lại trong hôm nay. Viết ra đúng 1 câu duy nhất lên giấy nháp: "Mục tiêu nhỏ nhất của ${projectName} tuần này là gì?".`,
    };
  }

  // Variant 2: Low motivation but manageable (avgScore <= 5) -> Tiny Habits Kick-off
  return {
    shouldIntervene: true,
    suggestionType: 'break_task',
    templateId: 'warmup_tiny_kickoff',
    tone: 'action_oriented',
    message: `Bạn đang ở tuần đầu tiên của "${projectName}" và ma sát ban đầu đang làm bạn ngập ngừng. Theo tâm lý học hành vi (Tiny Habits), bí quyết vượt qua giai đoạn này là hạ thấp ngưỡng hành động (activation threshold) đến mức não bộ không thể chối từ. Đừng cố gắng làm một khối việc khổng lồ, hãy chỉ tìm một chiến thắng siêu nhỏ để tạo trớn.`,
    actionStep: `Chọn một thao tác chỉ mất 5 phút cho "${projectName}" (như tạo file, gạch 3 đầu dòng ý tưởng) và hoàn thành ngay hôm nay. Không làm thêm bất cứ điều gì nữa.`,
  };
}
