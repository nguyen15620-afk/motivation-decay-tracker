# Motivation Decay Tracker

> Hệ thống theo dõi xu hướng động lực theo thời gian, phát hiện sự xói mòn tiệm tiến (gradual decay) bằng hồi quy tuyến tính (Linear Regression) và kích hoạt can thiệp sớm (Smart Interventions) trước khi người dùng từ bỏ mục tiêu.

📖 **[Xem Sổ Tay Hướng Dẫn Sử Dụng (User Guide)](./USER_GUIDE.md)**

---

## 🌟 Tính Năng Cốt Lõi

1. **Thuật Toán Phát Hiện Xói Mòn (Decay Detection Engine):**
   - **Cửa sổ trượt (Sliding Window):** 21 ngày gần nhất, yêu cầu tối thiểu $\ge 5$ điểm check-in để đảm bảo độ tin cậy thống kê.
   - **Hồi quy tuyến tính (Ordinary Least Squares - OLS):** Tính toán độ dốc (Slope), hệ số xác định ($R^2$ Confidence), và độ lệch chuẩn ($\sigma$).
   - **Phân biệt rạch ròi 4 trạng thái:**
     - `declining`: Độ dốc $slope \le -0.15$/ngày $\rightarrow$ Xói mòn động lực tiệm tiến.
     - `improving`: Độ dốc $slope \ge +0.10$/ngày $\rightarrow$ Động lực gia tăng.
     - `volatile`: Biến động mạnh ($\sigma \ge 2.0$) nhưng $|slope| < 0.10 \rightarrow$ Nhịp độ sinh hoạt thiếu nhất quán.
     - `stable`: Ổn định.
   - **Phát hiện sụt giảm đột ngột (Acute Sudden Drop):** Tụt $\ge 3.5$ điểm trong vòng 48 giờ $\rightarrow$ Burnout cấp tính hoặc vướng vật cản lớn.

2. **Hệ Thống Can Thiệp Thích Ứng (Adaptive Intervention Engine):**
   - **Ma trận 2 chiều Động lực $\times$ Năng lượng (2D Motivation-Energy Matrix):**
     - *Năng lượng thấp ($Energy \le 4$):* Kiệt quệ sinh học $\rightarrow$ Khuyến cáo nghỉ ngơi phục hồi thể lực (`take_break`), không ép nhận thức.
     - *Năng lượng cao ($Energy \ge 7$):* Tắc nghẽn nhận thức / Mục tiêu mơ hồ $\rightarrow$ Chia nhỏ vi mô 15 phút hoặc Brain Dump (`break_task`).
     - *Cột mốc mới hoàn thành:* Giải thích hiện tượng Thích ứng Khoái lạc (`celebrate_progress` - Hedonic Adaptation) và đặt micro-goal mới.
     - *Trồi sụt thất thường:* Tối ưu nhịp điệu sinh hoạt và timeboxing (`change_approach`).
     - *Sụt giảm đột ngột (Acute Drop $\ge 3.5$đ/48h):* Ưu tiên dừng khẩn cấp và nghỉ ngơi 24-48h.
   - **Thư viện mẫu câu tâm lý học hành vi (32+ Templates Pool):**
     - Đa dạng trường phái: *Đồng cảm ấm áp (`compassionate`)*, *Khoa học hành vi (`scientific`)*, *Hành động thực tế (`action_oriented`)*.
     - Cấu trúc 3 phần chuẩn hóa: Thừa nhận cảm xúc (Validation) + Góc nhìn tâm lý (Insight) + Hành động vi mô 5-10 phút (Action Step).
   - **Cơ chế xoay vòng chống nhàm chán (Anti-Repetition Window $k=3$):**
     - Tuyệt đối không lặp lại `template_id` trong 3 lần can thiệp gần nhất của cùng một dự án ($Pool \setminus History_{k=3}$).
   - **Vòng lặp học từ phản hồi (Feedback Weight Adjustment):**
     - Người dùng đánh giá `helpful`: Nhân trọng số $\times 2.0$ cho tone và phong cách yêu thích.
     - Người dùng đánh giá `not_helpful` hoặc `dismissed`: Hạ trọng số $\times 0.2$ và tự động chuyển đổi sang phong cách tiếp cận khác.
    - **Tùy chọn tăng cường AI & Kiến trúc Hybrid (BYOK - Bring Your Own Key):**
      - **Mô hình Hybrid:** Cho phép người dùng **tự nhập Gemini API Key cá nhân** qua Modal Settings (`localStorage`) hoặc sử dụng key dùng chung từ server qua `process.env.GEMINI_API_KEY`.
      - **Bảo mật Zero Server Persistence:** Key cá nhân của người dùng được lưu trữ cục bộ tại trình duyệt, chỉ truyền qua HTTPS Header `x-gemini-api-key` khi check-in và không bao giờ lưu vào Database.
      - **Phòng vệ tuyệt đối (Resilient Fallback):** Nếu không có key, sai key, hoặc timeout > 2.5s, hệ thống tự động fallback về kho 32 Template CBT Offline (< 1ms).

3. **Đo Lường Hiệu Quả Can Thiệp & Telemetry (Sprint v1.1 - Efficacy Loop):**
   - **Chỉ số phục hồi thực tế (Recovery Delta):** $\Delta_{recovery} = Slope_{post} - Slope_{pre}$. Đo lường sự thay đổi của độ dốc sau khi nhận can thiệp (tối thiểu 3 check-in kế tiếp).
   - **Giao thức nâng cấp (Escalation Protocol):** Nếu can thiệp trước đó không hiệu quả ($\Delta_{recovery} \le 0$), hệ thống tự động chuyển đổi từ chia nhỏ task vi mô sang đổi khung giờ làm việc hoặc tìm kiếm mentorship/đồng nghiệp.
   - **Telemetry & Acceptance Rate:** Thống kê tỷ lệ chấp nhận theo từng Template, Tone và Category phục vụ A/B Testing và loại bỏ các mẫu câu kém hiệu quả.

4. **Xử Lý Khoảng Trống Khởi Đầu (Cold-Start Early Warmup):**
   - Dành riêng cho dự án mới ($< 5$ check-in) trước khi thuật toán hồi quy 21 ngày đạt độ tin cậy thống kê.
   - Phát hiện sớm sự ngập ngừng/tụt điểm ban đầu và kích hoạt hướng dẫn tạo đà khởi động (Kick-off Momentum / Tiny Habits).

5. **Nguyên Tắc Thiết Kế Trải Nghiệm & Thẻ Ngữ Cảnh 1 Chạm (Non-Punitive UX):**
   - **Thẻ ngữ cảnh 1 chạm (Quick Context Chips):** `[Mất ngủ / Mệt mỏi]`, `[Task mơ hồ]`, `[Ngợp việc]`, `[Xong milestone]`. Tự động gắn tag vào ghi chú mà không đòi hỏi người dùng mệt mỏi phải gõ bàn phím.
   - Check-in nhanh 10-15 giây: Slider trực quan điểm tinh thần (1-10) + tách biệt năng lượng thể chất (1-10).
   - **Không áp dụng streak counter tiêu cực:** Tránh tâm lý "bỏ lỡ 1 ngày là hỏng hết" (all-or-nothing effect). Thay vào đó hiển thị tỷ lệ che phủ *X/30 ngày*.
   - **Trực quan hóa phục hồi:** Card `InterventionEfficacyCard` trên dashboard dự án thể hiện trực tiếp sự hồi phục điểm số sau can thiệp.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS + Dark Mode Theme
- **Data & Auth:** Supabase (PostgreSQL) + RLS Policies + Fallback In-Memory Store
- **Visualization:** Recharts (Scatter actual points, OLS Trendline, Energy correlation)
- **Background Jobs:** `/api/cron/analyze-trends` (Tương thích Vercel Cron & Supabase Edge Functions)

---

## 🚀 Khởi Chạy Dự Án

### 1. Cài đặt dependencies:
```bash
npm install
```

### 2. Chạy môi trường phát triển:
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

### 3. Kiểm thử tự động (Unit Tests):
```bash
npx tsx --test test/engine.test.ts
```

### 4. Thiết lập Supabase (Khi triển khai Production):
- Tạo dự án mới trên [Supabase](https://supabase.com).
- Chạy script SQL tại `supabase/migrations/001_init_schema.sql` trong SQL Editor.
- Tạo file `.env.local` và điền URL & Anon Key:
  ```env
  NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
  ```
*(Nếu chưa cấu hình Supabase, hệ thống sẽ tự động sử dụng Demo Data Store với các dự án thực tế: pyRevit MEP tools, MotoCare, AI MEP integration, Smoke Control).*
