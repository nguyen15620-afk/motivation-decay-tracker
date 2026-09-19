/**
 * Template Pool: take_break (Nghỉ ngơi phục hồi)
 * Targets: Acute Sudden Drop, Physical Exhaustion (Low Energy), Burnout
 */

import { InterventionTemplate } from './types';

export const TAKE_BREAK_TEMPLATES: InterventionTemplate[] = [
  {
    id: 'tb_comp_acute_01',
    suggestionType: 'take_break',
    tone: 'compassionate',
    energyContext: 'low_energy',
    validation: 'Hệ thống nhận thấy bạn vừa trải qua một đợt tụt năng lượng rõ rệt. Cảm giác kiệt sức này hoàn toàn có thật và rất đáng được trân trọng.',
    insight: 'Cố gắng đẩy tiếp khi pin sinh học dưới 10% chỉ tạo thêm cảm giác chán ghét tiềm thức với dự án.',
    actionStep: 'Tạm gác màn hình trong 24 giờ. Đi dạo 15 phút hoặc ngủ đủ giấc mà không bật laptop.',
    renderMessage: (p) =>
      `Hệ thống nhận thấy điểm động lực và thể lực cho "${p}" vừa giảm nhanh. Cảm giác mệt mỏi này hoàn toàn tự nhiên sau chuỗi ngày tập trung cao độ. Cố ép bản thân lúc này chỉ làm tăng ma sát tâm lý. Hãy cho phép mình nghỉ ngơi và ngắt kết nối hoàn toàn trong 24h tới để hệ thần kinh được tái tạo.`,
    tags: ['acute', 'burnout', 'sleep', 'disconnect'],
  },
  {
    id: 'tb_sci_circadian_02',
    suggestionType: 'take_break',
    tone: 'scientific',
    energyContext: 'low_energy',
    validation: 'Chỉ số thể chất giảm sút cho thấy hệ thần kinh tự chủ đang phát tín hiệu bảo vệ cơ thể.',
    insight: 'Theo sinh học thần kinh, sự cạn kiệt dopamine và glycogen ở vỏ não trước trán làm tê liệt khả năng ra quyết định logic.',
    actionStep: 'Áp dụng nghỉ ngơi chủ động (Non-Sleep Deep Rest - NSDR) trong 20 phút để phục hồi sóng não.',
    renderMessage: (p) =>
      `Tín hiệu suy giảm điểm số tại "${p}" phản ánh trạng thái cạn kiệt dopamine sinh học của não bộ. Đây là phản xạ bảo vệ của hệ thần kinh trước tình trạng quá tải nhận thức, không phải do bạn yếu kém ý chí. Hãy dành 20 phút nghỉ ngơi sâu (NSDR) hoặc ngủ một giấc ngắn trước khi chạm lại vào task.`,
    tags: ['neuroscience', 'dopamine', 'recovery'],
  },
  {
    id: 'tb_act_strategic_03',
    suggestionType: 'take_break',
    tone: 'action_oriented',
    energyContext: 'low_energy',
    validation: 'Điểm số rớt mạnh là chiếc phanh gấp cần thiết trước khi bạn đâm vào bức tường kiệt sức toàn diện.',
    insight: 'Nghỉ ngơi không phải là từ bỏ; nghỉ ngơi là một quyết định chiến thuật tối ưu hiệu suất.',
    actionStep: 'Khóa lịch dự án 1 ngày. Đặt chuông hẹn giờ vào 9h sáng ngày mai mới đánh giá lại.',
    renderMessage: (p) =>
      `Điểm số tụt gấp ở "${p}" là lúc bạn cần phanh chiến thuật. Những lập trình viên và kỹ sư xuất sắc nhất đều biết dừng lại nghỉ ngơi đúng lúc trước khi rơi vào burnout mãn tính. Hãy đóng toàn bộ tab liên quan đến dự án hôm nay và quay lại với đầu óc trong trẻo vào sáng mai.`,
    tags: ['tactical', 'strategic_pause'],
  },
  {
    id: 'tb_comp_guilt_free_04',
    suggestionType: 'take_break',
    tone: 'compassionate',
    energyContext: 'any',
    validation: 'Bạn có thể đang cảm thấy bứt rứt hoặc có lỗi vì không làm việc hiệu quả như kỳ vọng.',
    insight: 'Năng suất con người theo chu kỳ hình sin, không phải đường thẳng dốc đứng liên tục.',
    actionStep: 'Tự nhủ: "Hôm nay mình nghỉ để ngày mai đi xa hơn".',
    renderMessage: (p) =>
      `Đừng để cảm giác tội lỗi đè nặng khi bạn thấy động lực cho "${p}" chùng xuống. Năng suất con người luôn dao động theo chu kỳ tự nhiên. Việc chấp nhận nghỉ ngơi thả lỏng hôm nay chính là điều kiện tiên quyết để giữ lửa dài hạn cho dự án.`,
    tags: ['guilt_relief', 'compassion'],
  },
  {
    id: 'tb_sci_parasympathetic_05',
    suggestionType: 'take_break',
    tone: 'scientific',
    energyContext: 'low_energy',
    validation: 'Cơ thể bạn đang ở trạng thái kích hoạt quá mức của hệ giao cảm (Sympathetic overdrive).',
    insight: 'Cortisol tăng cao kéo dài làm giảm tính linh hoạt khớp thần kinh (neuroplasticity).',
    actionStep: 'Uống 1 cốc nước ấm, hít thở sâu theo nhịp 4-7-8 trong 3 phút.',
    renderMessage: (p) =>
      `Chỉ số sụt giảm gần đây của "${p}" cảnh báo nồng độ căng thẳng thể chất đang tích tụ. Não bộ chỉ có thể tư duy sáng tạo khi hệ đối giao cảm được phục hồi. Hãy rời bàn làm việc nghỉ ngơi, uống một ngụm nước và hít thở sâu 3 phút để hạ mức cortisol.`,
    tags: ['stress_reduction', 'biology'],
  },
  {
    id: 'tb_act_digital_detox_06',
    suggestionType: 'take_break',
    tone: 'action_oriented',
    energyContext: 'any',
    validation: 'Mắt và tâm trí bạn đã phải xử lý quá nhiều pixel và logic phức tạp.',
    insight: 'Sự mệt mỏi về thị giác và nhận thức làm giảm 40% khả năng giải quyết vấn đề.',
    actionStep: 'Rời xa mọi màn hình điện tử trong ít nhất 45 phút.',
    renderMessage: (p) =>
      `Sự chững lại ở "${p}" là lời nhắc cơ thể đang quá tải thị giác và thông tin. Thay vì cố nhìn chằm chằm vào code hay tài liệu, hãy nghỉ ngơi và thực hiện một đợt Digital Detox ngắn 45 phút — bước ra ngoài trời hoặc rửa mặt bằng nước mát.`,
    tags: ['detox', 'screen_break'],
  },
  {
    id: 'tb_comp_restore_07',
    suggestionType: 'take_break',
    tone: 'compassionate',
    energyContext: 'low_energy',
    validation: 'Bạn đã nỗ lực rất nhiều cho dự án này suốt thời gian qua.',
    insight: 'Một người chạy marathon không thể duy trì tốc độ nước rút ở mọi ki-lô-mét.',
    actionStep: 'Tự thưởng cho bản thân một buổi tối thư giãn không công việc.',
    renderMessage: (p) =>
      `Nhìn lại hành trình, bạn đã dồn rất nhiều tâm huyết cho "${p}". Sự suy giảm hiện tại chỉ đơn giản là trạm dừng nghỉ ngơi nạp nhiên liệu. Hãy dành trọn buổi tối nay để nghe nhạc hoặc ăn món mình thích mà không bận tâm đến deadline.`,
    tags: ['recharge', 'marathon_mindset'],
  },
  {
    id: 'tb_sci_sleep_hygiene_08',
    suggestionType: 'take_break',
    tone: 'scientific',
    energyContext: 'low_energy',
    validation: 'Năng lượng thể chất suy kiệt là nguyên nhân hàng đầu dẫn đến mất động lực tinh thần.',
    insight: 'Giấc ngủ REM là nơi não bộ củng cố ký ức kỹ thuật và gỡ bỏ các ức chế âu lo.',
    actionStep: 'Đi ngủ sớm hơn thường lệ 1 tiếng đêm nay.',
    renderMessage: (p) =>
      `Phân tích dữ liệu cho thấy sự xói mòn động lực ở "${p}" gắn liền với mức năng lượng thể chất thấp. Hãy dành thời gian nghỉ ngơi trọn vẹn và đi ngủ sớm tối nay để chu kỳ giấc ngủ REM phục hồi lại sức bật tinh thần.`,
    tags: ['sleep', 'rem_recovery'],
  },
];
