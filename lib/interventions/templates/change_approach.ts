/**
 * Template Pool: change_approach (Tối ưu cách tiếp cận & Nhịp điệu)
 * Targets: High Volatility (Trồi sụt thất thường), Boom-and-Bust Cycles, Scheduling Inconsistency
 */

import { InterventionTemplate } from './types';

export const CHANGE_APPROACH_TEMPLATES: InterventionTemplate[] = [
  {
    id: 'ca_sci_circadian_rhythm_01',
    suggestionType: 'change_approach',
    tone: 'scientific',
    energyContext: 'any',
    validation: 'Động lực của bạn biến động mạnh (hôm nay 9, ngày mai tụt xuống 3-4).',
    insight: 'Hiện tượng "Bùng nổ rồi kiệt sức" (Boom-and-Bust cycle) phá hủy nhịp sinh học và tạo ra sự bất ổn nhận thức.',
    actionStep: 'Áp dụng trần giới hạn giờ làm việc (Work capping): Không làm quá 90 phút/phiên dù đang rất hăng say.',
    renderMessage: (p) =>
      `Động lực của bạn với "${p}" đang dao động rất mạnh giữa các ngày. Vấn đề không nằm ở sự đam mê mà ở chu kỳ "Bùng nổ rồi kiệt sức". Khi đang hăng, chúng ta dễ làm việc quá đà để rồi cạn kiệt ngày hôm sau. Hãy thử đặt giới hạn tối đa 60-90 phút/ngày để giữ ngọn lửa âm ỉ ổn định thay vì cháy bùng rồi tắt ngấm.`,
    tags: ['boom_and_bust', 'pacing', 'volatility'],
  },
  {
    id: 'ca_act_timebox_02',
    suggestionType: 'change_approach',
    tone: 'action_oriented',
    energyContext: 'high_energy',
    validation: 'Làm việc theo cảm hứng thất thường khiến bạn khó duy trì tiến độ ổn định.',
    insight: 'Định luật Parkinson: Công việc luôn tự phình to để lấp đầy khoảng thời gian được ấn định cho nó.',
    actionStep: 'Sử dụng Timeboxing: Khóa chết một khung giờ cố định duy nhất trong ngày (ví dụ 8h30 - 9h15).',
    renderMessage: (p) =>
      `Biểu đồ cho thấy nhịp làm việc tại "${p}" đang dao động và phụ thuộc quá nhiều vào cảm xúc bộc phát. Đừng chờ cảm hứng mới làm việc; hãy biến nó thành một khung giờ cố định (Timeboxing) mỗi ngày, đúng giờ đó là ngồi vào bàn 45 phút rồi nghỉ. Tính đều đặn đánh bại mọi cơn sốt cảm hứng chớp nhoáng.`,
    tags: ['timeboxing', 'parkinson_law', 'discipline'],
  },
  {
    id: 'ca_comp_self_compassion_03',
    suggestionType: 'change_approach',
    tone: 'compassionate',
    energyContext: 'any',
    validation: 'Sự trồi sụt có thể khiến bạn cảm thấy bản thân thiếu kỷ luật hoặc tự trách mình.',
    insight: 'Tâm lý học khẳng định: Tha thứ cho những ngày sa sút giúp tái thiết lập kỷ luật nhanh hơn sự tự chỉ trích.',
    actionStep: 'Ghi nhận hôm nay là một ngày nốt trầm trong bản nhạc dài của dự án.',
    renderMessage: (p) =>
      `Đừng thất vọng khi thấy phong độ với "${p}" đang dao động lên xuống như đồ thị hình sin. Cuộc sống luôn có những biến số bất ngờ về công việc và sức khỏe. Thay vì tự trách bản thân thiếu kiên định, hãy nhẹ nhàng chấp nhận ngày nốt trầm này và tiếp tục với một thái độ thong dong hơn vào ngày mai.`,
    tags: ['self_compassion', 'resilience', 'acceptance'],
  },
  {
    id: 'ca_sci_habit_loop_04',
    suggestionType: 'change_approach',
    tone: 'scientific',
    energyContext: 'any',
    validation: 'Bạn đang phải dùng quá nhiều ý chí (Willpower) để bắt đầu công việc mỗi ngày.',
    insight: 'Ý chí là tài nguyên hữu hạn bị tiêu hao bởi các quyết định trong ngày (Decision Fatigue).',
    actionStep: 'Tạo một thói quen neo (Habit Stacking): Gắn dự án vào ngay sau một thói quen có sẵn (như uống cà phê sáng).',
    renderMessage: (p) =>
      `Sự dao động động lực ở "${p}" cảnh báo rằng bạn đang tốn quá nhiều sức mạnh ý chí (Willpower) để khởi động. Hãy dùng kỹ thuật Habit Stacking của James Clear: Ghép việc làm dự án ngay sau một thói quen tự động, ví dụ: "Ngay sau khi pha xong cốc cà phê sáng, mình sẽ ngồi vào mở dự án 20 phút". Không cần suy nghĩ hay đắn đo.`,
    tags: ['habit_stacking', 'willpower', 'decision_fatigue'],
  },
  {
    id: 'ca_act_change_environment_05',
    suggestionType: 'change_approach',
    tone: 'action_oriented',
    energyContext: 'any',
    validation: 'Không gian làm việc quen thuộc có thể đang tạo ra sự nhàm chán tiềm thức.',
    insight: 'Não bộ gắn kết không gian vật lý với các trạng thái tâm lý tương ứng (Context-dependent memory).',
    actionStep: 'Đổi góc làm việc: Ra quán cà phê yên tĩnh, ra ban công hoặc dọn sạch mặt bàn.',
    renderMessage: (p) =>
      `Động lực đang dao động thất thường tại "${p}" có thể là dấu hiệu không gian làm việc đang bị bão hòa kích thích. Hãy thử thay đổi bối cảnh: mang laptop ra quán cà phê mới, đổi chỗ ngồi hoặc dọn dẹp thật thoáng mặt bàn làm việc. Một góc nhìn mới thường mang lại luồng sinh khí mới cho dự án.`,
    tags: ['environment_shift', 'context', 'novelty'],
  },
  {
    id: 'ca_comp_rhythm_over_speed_06',
    suggestionType: 'change_approach',
    tone: 'compassionate',
    energyContext: 'low_energy',
    validation: 'Bạn đang bị giằng xé giữa muốn tiến nhanh nhưng cơ thể lại biểu tình.',
    insight: 'Nhịp điệu quan trọng hơn tốc độ. Đi chậm nhưng nhịp nhàng sẽ đưa bạn đến đích an toàn.',
    actionStep: 'Chọn một tốc độ tối thiểu mà bạn có thể duy trì cả năm mà không thấy mệt.',
    renderMessage: (p) =>
      `Động lực dao động ở "${p}" cho thấy bạn đang ép mình đi quá nhanh ở một số ngày. Hãy nhớ: Nhịp điệu quan trọng hơn tốc độ tuyệt đối. Thay vì ngày làm 8 tiếng ngày nghỉ bẵng, hãy hạ kỳ vọng xuống mức tối thiểu 30 phút mỗi ngày nhưng giữ nhịp thở đều đặn và bình an.`,
    tags: ['rhythm', 'sustainable_pace'],
  },
  {
    id: 'ca_act_pomodoro_tuning_07',
    suggestionType: 'change_approach',
    tone: 'action_oriented',
    energyContext: 'any',
    validation: 'Các phiên làm việc của bạn đang bị phân mảnh bởi thông báo hoặc mất tập trung.',
    insight: 'Mỗi lần bị gián đoạn, não mất trung bình 23 phút để lấy lại trạng thái tập trung sâu (Deep Work).',
    actionStep: 'Thử 1 phiên Pomodoro chuẩn 25 phút: Bật chế độ Do Not Disturb trên toàn bộ thiết bị.',
    renderMessage: (p) =>
      `Nhịp độ dao động ở "${p}" thường do tình trạng phân mảnh chú ý gây ra. Hãy thử thiết lập một phiên làm việc sâu Pomodoro 25 phút trọn vẹn: tắt thông báo điện thoại, đóng các tab mạng xã hội và chỉ tập trung vào một nhiệm vụ duy nhất trước mắt.`,
    tags: ['deep_work', 'pomodoro', 'focus'],
  },
  {
    id: 'ca_sci_energy_audit_08',
    suggestionType: 'change_approach',
    tone: 'scientific',
    energyContext: 'any',
    validation: 'Có thể bạn đang làm việc với dự án này sai thời điểm sinh học trong ngày.',
    insight: 'Đỉnh cao nhận thức (Chronotype) của mỗi người rơi vào các khung giờ khác nhau (Sáng sớm vs Đêm muộn).',
    actionStep: 'Thử dịch chuyển lịch làm dự án sang một khung giờ khác trong ngày (ví dụ từ tối chuyển sang đầu giờ sáng).',
    renderMessage: (p) =>
      `Dữ liệu dao động của "${p}" gợi ý rằng thời điểm bạn dành cho dự án trong ngày có thể đang xung đột với nhịp sinh học tự nhiên (Chronotype). Nếu bạn thường làm vào cuối ngày khi đã kiệt sức sau công việc chính, hãy thử chuyển 30 phút làm việc sang đầu giờ sáng khi tâm trí còn tinh khôi.`,
    tags: ['chronotype', 'circadian', 'timing'],
  },
];
