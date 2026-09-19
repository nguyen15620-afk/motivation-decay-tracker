/**
 * Template Pool: celebrate_progress (Ghi nhận thành quả & Tái tạo hứng khởi)
 * Targets: Post-milestone slump, Hedonic Adaptation, Achievement Plateau
 */

import { InterventionTemplate } from './types';

export const CELEBRATE_PROGRESS_TEMPLATES: InterventionTemplate[] = [
  {
    id: 'cp_sci_hedonic_adaptation_01',
    suggestionType: 'celebrate_progress',
    tone: 'scientific',
    energyContext: 'any',
    validation: 'Động lực có xu hướng chững lại rõ rệt ngay sau khi bạn vừa hoàn thành một cột mốc lớn.',
    insight: 'Hiện tượng Thích ứng Khoái lạc (Hedonic Adaptation): Não nhanh chóng bình thường hóa thành tích vừa đạt được và tạo ra cảm giác trống rỗng tạm thời.',
    actionStep: 'Viết ra 3 điều dự án đã làm được và đặt 1 micro-goal nhỏ mới để kích hoạt dopamine mới.',
    renderMessage: (p) =>
      `Động lực cho "${p}" có xu hướng chững lại sau khi hoàn thành cột mốc. Đây là hiện tượng tâm lý tự nhiên (Hedonic Adaptation): não bộ thích ứng rất nhanh với thành tích vừa đạt và tạo ra khoảng trống hứng thú. Hãy dành chút thời gian ghi nhận thành quả, sau đó thiết lập một mục tiêu nhỏ mới (Micro-goal) để tái tạo hứng khởi.`,
    tags: ['hedonic_adaptation', 'milestone', 'psychology'],
  },
  {
    id: 'cp_comp_pause_and_savor_02',
    suggestionType: 'celebrate_progress',
    tone: 'compassionate',
    energyContext: 'any',
    validation: 'Chúng ta thường có thói quen vội vã lao vào ngọn núi tiếp theo mà quên nhìn lại đỉnh núi vừa chinh phục.',
    insight: 'Năng lực tận hưởng (Savoring) là nền tảng nuôi dưỡng lòng kiên trì dài hạn (Grit).',
    actionStep: 'Tự thưởng cho bản thân một món quà nhỏ hoặc một buổi cà phê thảnh thơi để đánh dấu cột mốc.',
    renderMessage: (p) =>
      `Bạn vừa hoàn thành một bước tiến quan trọng với "${p}"! Đừng để hiện tượng chững lại sau thành tích (Hedonic Adaptation) làm bạn hoang mang. Hãy cho phép mình dừng lại 1-2 ngày để thưởng thức trọn vẹn cảm giác chiến thắng này. Bạn xứng đáng được tự hào về những gì đã làm được.`,
    tags: ['savoring', 'celebration', 'grit'],
  },
  {
    id: 'cp_act_micro_goal_03',
    suggestionType: 'celebrate_progress',
    tone: 'action_oriented',
    energyContext: 'high_energy',
    validation: 'Sau khi qua vạch đích của giai đoạn trước, bạn đang chưa biết bước tiếp theo bắt đầu từ đâu.',
    insight: 'Động lực mới chỉ xuất hiện khi mục tiêu tiếp theo có độ thử thách vừa phải (Flow State).',
    actionStep: 'Vẽ ra tấm bản đồ tiếp theo: Xác định duy nhất 1 tính năng kế tiếp cho giai đoạn mới.',
    renderMessage: (p) =>
      `Cột mốc vừa qua tại "${p}" đã hoàn tất xuất sắc! Khoảng lặng hiện tại là phản ứng thích ứng tâm lý tự nhiên (Hedonic Adaptation). Hãy lấy một trang giấy trắng, vạch ra đúng 1 mục tiêu tiếp theo cho tuần tới để tạo luồng sinh khí mới cho dự án.`,
    tags: ['flow_state', 'next_chapter', 'action'],
  },
  {
    id: 'cp_sci_dopamine_baseline_04',
    suggestionType: 'celebrate_progress',
    tone: 'scientific',
    energyContext: 'any',
    validation: 'Sau đỉnh cao phấn khích khi bàn giao, nồng độ năng lượng thường rớt nhẹ xuống dưới mức cơ sở.',
    insight: 'Dopamine baseline cần 48-72h để tái cân bằng sau những thời khắc ăn mừng hưng phấn.',
    actionStep: 'Giữ tốc độ làm việc nhẹ nhàng, không cố ép cảm xúc phải hào hứng như ngày ra mắt.',
    renderMessage: (p) =>
      `Cảm giác chững lại ở "${p}" là phản ứng sinh học chuẩn xác của cơ chế Hedonic Adaptation: sau đỉnh cao dopamine khi đạt cột mốc, cơ thể sẽ có pha hạ nhiệt tự nhiên (Dopamine Reset). Đừng hoảng hốt nếu thấy mình bớt hào hứng. Hãy cho bản thân 48h làm những việc nhẹ nhàng để mức dopamine tự nhiên trở lại cân bằng.`,
    tags: ['neuroscience', 'dopamine_reset', 'recovery'],
  },
  {
    id: 'cp_comp_gratitude_journey_05',
    suggestionType: 'celebrate_progress',
    tone: 'compassionate',
    energyContext: 'any',
    validation: 'Nhìn lại vạch xuất phát ngày đầu, bạn đã đi được một quãng đường rất xa.',
    insight: 'Thực hành lòng biết ơn (Gratitude) giúp chuyển hóa tư duy từ "thiếu thốn" sang "dồi dào".',
    actionStep: 'Lướt lại nhật ký commit/check-in đầu tiên của dự án để thấy mình đã tiến bộ thế nào.',
    renderMessage: (p) =>
      `Đôi khi chúng ta mải nhìn về phía trước và rơi vào bẫy thích ứng thành quả (Hedonic Adaptation) mà quên mất mình đã đi được bao xa với "${p}". Hãy thử mở lại những dòng code hoặc ghi chú ngày đầu tiên bạn khởi động dự án để thấy sự tiến bộ vượt bậc mà bạn đã tạo ra.`,
    tags: ['gratitude', 'journey', 'perspective'],
  },
  {
    id: 'cp_act_share_win_06',
    suggestionType: 'celebrate_progress',
    tone: 'action_oriented',
    energyContext: 'any',
    validation: 'Thành quả kỹ thuật của bạn xứng đáng được chia sẻ ra cộng đồng.',
    insight: 'Phản hồi tích cực từ bên ngoài (Social Proof) là chất xúc tác cực mạnh để tái tạo đam mê.',
    actionStep: 'Viết một bài chia sẻ ngắn (Show & Tell) về bài học kỹ thuật bạn vừa rút ra được.',
    renderMessage: (p) =>
      `Cột mốc bạn vừa đạt được với "${p}" chứa đựng rất nhiều bài học quý giá. Thay vì để hiện tượng Hedonic Adaptation làm nguội lạnh hứng khởi, hãy thử viết một đoạn chia sẻ ngắn lên nhóm lập trình. Sự đón nhận từ cộng đồng sẽ tiếp thêm nguồn cảm hứng dồi dào cho chặng đường tiếp theo.`,
    tags: ['share_win', 'social_proof', 'inspiration'],
  },
  {
    id: 'cp_sci_intrinsic_reconnect_07',
    suggestionType: 'celebrate_progress',
    tone: 'scientific',
    energyContext: 'any',
    validation: 'Khi mục tiêu bên ngoài (External target) đã xong, động lực nội tại (Intrinsic motivation) cần được thắp lại.',
    insight: 'Thuyết Tự quyết (Self-Determination Theory): Động lực bền vững nhất đến từ Tự chủ (Autonomy) và Năng lực (Competence).',
    actionStep: 'Tự hỏi: "Điều gì trong dự án này khiến mình cảm thấy tò mò và yêu thích nhất?".',
    renderMessage: (p) =>
      `Sau khi cột mốc của "${p}" hoàn tất, hiện tượng thích ứng tâm lý (Hedonic Adaptation) là tín hiệu để bạn tái kết nối với động lực nội tại. Hãy giải phóng bản thân khỏi các deadline áp đặt và dành vài ngày vọc vạch một khía cạnh kỹ thuật mới mẻ khiến bạn thực sự hào hứng.`,
    tags: ['intrinsic_motivation', 'autonomy', 'curiosity'],
  },
  {
    id: 'cp_act_clean_slate_08',
    suggestionType: 'celebrate_progress',
    tone: 'action_oriented',
    energyContext: 'any',
    validation: 'Sau một giai đoạn lớn, kho mã nguồn và danh sách task thường bừa bộn rác kỹ thuật.',
    insight: 'Dọn dẹp tạo ra cảm giác kiểm soát và một điểm xuất phát mới mẻ (Fresh Start Effect).',
    actionStep: 'Dành 30 phút dọn dẹp các branch cũ, refactor lại 1 file code đẹp mắt.',
    renderMessage: (p) =>
      `Chúc mừng cột mốc vừa qua tại "${p}"! Để vượt qua quán tính Hedonic Adaptation và chuẩn bị tâm thế vững vàng cho giai đoạn mới, hãy tận dụng "Hiệu ứng Khởi đầu Mới" (Fresh Start Effect). Dành 30 phút dọn sạch các ghi chú cũ, refactor lại một module code cho thật gọn gàng trước khi mở đầu chương mới.`,
    tags: ['fresh_start', 'refactor', 'clean_slate'],
  },
];
