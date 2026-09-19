/**
 * Template Pool: break_task (Chia nhỏ nhiệm vụ / Vượt qua ma sát)
 * Targets: Gradual Decay, Cognitive Blocker, High Energy with Ambiguity, Overwhelm
 */

import { InterventionTemplate } from './types';

export const BREAK_TASK_TEMPLATES: InterventionTemplate[] = [
  {
    id: 'bt_act_micro_15m_01',
    suggestionType: 'break_task',
    tone: 'action_oriented',
    energyContext: 'any',
    validation: 'Động lực đang giảm dần theo ngày, thường là do khối lượng công việc phía trước nhìn như một tảng đá khổng lồ.',
    insight: 'Nguyên lý Kaizen: Não bộ chống cự các mục tiêu lớn nhưng không đề phòng những hành động siêu nhỏ.',
    actionStep: 'Tách 1 micro-task nhỏ đến mức nực cười và hoàn thành nó trong đúng 15 phút.',
    renderMessage: (p) =>
      `Động lực của bạn với "${p}" đang giảm đều đặn theo thời gian. Khả năng cao mục tiêu hiện tại đang quá lớn hoặc thiếu rõ ràng. Hãy thử chia nhỏ bước tiếp theo thành một hành động siêu nhỏ chỉ mất 15 phút để hoàn thành (Micro-step). Khi vượt qua ma sát ban đầu, đà làm việc (momentum) sẽ tự quay lại.`,
    tags: ['kaizen', 'momentum', 'micro_step'],
  },
  {
    id: 'bt_comp_friction_02',
    suggestionType: 'break_task',
    tone: 'compassionate',
    energyContext: 'any',
    validation: 'Cảm giác bế tắc hoặc ngợp việc trước dự án là điều mà bất kỳ ai cũng phải đối mặt.',
    insight: 'Chúng ta thường trì hoãn không phải vì lười biếng, mà vì não bộ đang tìm cách bảo vệ ta khỏi cảm giác quá tải.',
    actionStep: 'Chỉ cần mở file code/tài liệu lên và viết 2 dòng ghi chú trong 15 phút, không cần làm gì thêm.',
    renderMessage: (p) =>
      `Cảm giác ngột ngạt khi nhìn vào danh sách việc chưa xong của "${p}" là rất dễ hiểu. Trì hoãn thực chất là phản xạ tự vệ tâm lý trước sự mơ hồ. Hôm nay, hãy giảm toàn bộ áp lực: chỉ cần dành đúng 15 phút mở file dự án ra xem lại đề bài mà không ép mình phải giải quyết xong hết.`,
    tags: ['empathy', 'friction_reduction', 'tiny_habits'],
  },
  {
    id: 'bt_sci_zeigarnik_03',
    suggestionType: 'break_task',
    tone: 'scientific',
    energyContext: 'high_energy',
    validation: 'Bạn vẫn có nhiều năng lượng thể chất, nhưng việc triển khai lại bị khựng lại.',
    insight: 'Hiệu ứng Zeigarnik: Não bộ chỉ tạo ra năng lượng tập trung sau khi một hành động đã thực sự bắt đầu.',
    actionStep: 'Thực hiện thao tác khởi động vi mô trong 15 phút.',
    renderMessage: (p) =>
      `Bạn đang có sẵn năng lượng nhưng điểm gắn kết với "${p}" lại đi xuống — đây là hiện tượng Tắc nghẽn Nhận thức (Cognitive Friction). Theo hiệu ứng Zeigarnik, não chỉ tiết dopamine duy trì sau khi đã bắt đầu. Hãy dành đúng 15 phút làm một thao tác đơn giản nhất có thể ngay bây giờ.`,
    tags: ['zeigarnik', 'cognitive_block', 'high_energy'],
  },
  {
    id: 'bt_act_brain_dump_04',
    suggestionType: 'break_task',
    tone: 'action_oriented',
    energyContext: 'any',
    validation: 'Đầu óc bạn đang chứa quá nhiều nhánh suy nghĩ chưa được hệ thống hóa.',
    insight: 'RAM nhận thức của con người chỉ giữ được 4-7 luồng suy nghĩ cùng lúc trước khi bị tràn bộ nhớ.',
    actionStep: 'Lấy giấy bút viết xả (Brain Dump) toàn bộ các lo lắng và việc cần làm ra giấy trong 15 phút.',
    renderMessage: (p) =>
      `Xu hướng xói mòn động lực ở "${p}" cho thấy bộ nhớ nhận thức đang bị quá tải bởi chi tiết vụn vặt. Hãy dừng việc ghi nhớ trong đầu: dành 15 phút viết xả (Brain dump) toàn bộ danh sách bug ra giấy nháp, sau đó chỉ chọn 1 việc duy nhất để làm.`,
    tags: ['brain_dump', 'externalize', 'clarity'],
  },
  {
    id: 'bt_sci_bjfogg_05',
    suggestionType: 'break_task',
    tone: 'scientific',
    energyContext: 'any',
    validation: 'Kỳ vọng quá cao vào một buổi làm việc hoàn hảo thường phản tác dụng.',
    insight: 'Mô hình Hành vi Fogg (B = MAP): Khi Động lực (M) giảm, Năng lực thực thi (A) phải được làm cho siêu dễ để hành động xảy ra.',
    actionStep: 'Hạ thấp tiêu chuẩn của bước tiếp theo xuống mức tối thiểu (15 phút).',
    renderMessage: (p) =>
      `Theo Mô hình Hành vi Fogg, khi động lực tinh thần cho "${p}" đang trên đà sụt giảm, giải pháp khoa học duy nhất là hạ độ khó của nhiệm vụ. Hãy cam kết một phiên vi mô 15 phút: chỉ đặt mục tiêu viết một hàm thử nghiệm hoặc đọc lại 1 trang tài liệu kỹ thuật.`,
    tags: ['fogg_behavior', 'mva', 'low_barrier'],
  },
  {
    id: 'bt_comp_one_brick_06',
    suggestionType: 'break_task',
    tone: 'compassionate',
    energyContext: 'any',
    validation: 'Nhìn cả bức tường lớn bạn sẽ thấy nản, nhưng bạn chỉ cần đặt từng viên gạch một.',
    insight: 'Thành tựu vĩ đại được xây dựng từ những ngày bình thường hoàn thành những việc bình thường.',
    actionStep: 'Chọn một việc nhỏ duy nhất trong 15 phút và coi như đó là thành công trọn vẹn của hôm nay.',
    renderMessage: (p) =>
      `Bạn không cần phải hoàn thành cả dự án "${p}" ngay lúc này. Hãy nhớ: Người ta không xây một bức tường trong một ngày, người ta đặt từng viên gạch. Hôm nay, hãy chỉ dành 15 phút đặt 1 viên gạch nhỏ và cảm thấy tự hào vì bạn vẫn đang tiến bước.`,
    tags: ['one_brick', 'long_term', 'patience'],
  },
  {
    id: 'bt_act_scope_chop_07',
    suggestionType: 'break_task',
    tone: 'action_oriented',
    energyContext: 'high_energy',
    validation: 'Dự án đang phình to phạm vi (Scope Creep) ngoài dự kiến ban đầu.',
    insight: 'Nguyên lý Pareto 80/20: 20% tính năng cốt lõi tạo ra 80% giá trị thực tế.',
    actionStep: 'Cắt bỏ 50% tính năng rườm rà khỏi giai đoạn hiện tại, chỉ giữ lại phần lõi MVP trong 15 phút lên kế hoạch.',
    renderMessage: (p) =>
      `Sự xói mòn động lực ở "${p}" thường bắt nguồn từ hiện tượng Scope Creep (phạm vi mở rộng quá mức). Hãy dùng 15 phút rà soát để "chém" bớt 50% các yêu cầu phụ chưa cần thiết, chỉ tập trung vào tính năng lõi MVP trước mắt.`,
    tags: ['scope_creep', 'mvp', 'pareto'],
  },
  {
    id: 'bt_sci_implementation_intentions_08',
    suggestionType: 'break_task',
    tone: 'scientific',
    energyContext: 'any',
    validation: 'Ý định chung chung ("hôm nay sẽ làm dự án") hầu như luôn thất bại khi động lực thấp.',
    insight: 'Nghiên cứu của Peter Gollwitzer: Ý định thực thi "Nếu - Thì" (If-Then planning) tăng gấp 3 lần tỷ lệ hoàn thành.',
    actionStep: 'Viết công thức: "Nếu [thời điểm/địa điểm] thì tôi sẽ [hành động cụ thể trong 15 phút]".',
    renderMessage: (p) =>
      `Để đảo ngược xu hướng giảm động lực ở "${p}", khoa học hành vi khuyên dùng chiến lược 'Ý định thực thi' (Implementation Intentions). Hãy xác định rõ: "Đúng 14h00 ngồi vào bàn, mình sẽ dành đúng 15 phút xử lý xong dòng log này". Sự rõ ràng xóa tan do dự.`,
    tags: ['if_then', 'implementation_intentions', 'clarity'],
  },
];
