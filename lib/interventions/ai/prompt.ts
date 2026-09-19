/**
 * Motivation Decay Tracker - AI Empathy Prompt Engineering
 * 
 * Configures prompt structures rooted in Cognitive Behavioral Therapy (CBT),
 * Stoic perspective, and Tiny Habits / Kaizen behavior design.
 */

import { SuggestionType } from '../../supabase/types';

export interface AIPromptContext {
  projectName: string;
  slope: number;
  recentAverageEnergy?: number | null;
  recentContextNotes: string[];
  chosenCategory: SuggestionType;
}

export function buildAIEmpathyPrompt(ctx: AIPromptContext): string {
  const notesText = ctx.recentContextNotes.filter(Boolean).slice(0, 3).join('; ');
  const energyText = ctx.recentAverageEnergy ? `${ctx.recentAverageEnergy}/10` : 'Không có dữ liệu';

  return `Bạn là một Cố vấn Tâm lý Năng suất (Productivity & Behavioral Psychologist Companion) cho dự án Motivation Decay Tracker.

THÔNG TIN NGỮ CẢNH:
- Tên dự án: "${ctx.projectName}"
- Xu hướng động lực (Độ dốc OLS): ${ctx.slope}/ngày
- Mức năng lượng thể chất gần đây: ${energyText}
- Ghi chú gần nhất của người dùng: "${notesText || 'Không có ghi chú cụ thể'}"
- Chiến lược can thiệp mục tiêu: ${ctx.chosenCategory.toUpperCase()}

NGUYÊN TẮC SOẠN LỜI NHẮN:
1. Độ dài: Đúng 2-3 câu ngắn gọn (dưới 80 từ), tiếng Việt tự nhiên, ấm áp, không sáo rỗng hay giáo điều.
2. Thừa nhận và thấu cảm (Validation): Thấu hiểu khó khăn trong ghi chú ngữ cảnh của họ, bình thường hóa việc chững lại.
3. Giải thích ngắn gọn (Insight): Dựa trên tâm lý học hành vi (CBT, Hedonic Adaptation, hoặc Tiny Habits).
4. Hành động vi mô duy nhất (Action Step): 1 việc duy nhất làm được trong 5-10 phút.
5. Định dạng: Chỉ trả về nội dung tin nhắn, không thêm tiêu đề hay dấu ngoặc kép.`;
}
