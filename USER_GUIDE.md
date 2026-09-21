# Sổ Tay Hướng Dẫn Sử Dụng: Motivation Decay Tracker 🚀

> **Motivation Decay Tracker** là hệ thống theo dõi xu hướng động lực theo thời gian, ứng dụng thuật toán hồi quy tuyến tính (OLS) kết hợp tâm lý học hành vi (CBT) và AI cá nhân hóa để phát hiện sớm sự "xói mòn động lực tiệm tiến" (gradual decay) và đưa ra các hành động can thiệp vi mô kịp thời trước khi bạn từ bỏ mục tiêu.

---

## 📑 Mục Lục
1. [Triết Lý & Nguyên Tắc Hoạt Động](#1-triết-lý--nguyên-tắc-hoạt-động)
2. [Thiết Lập Ban Đầu & Tùy Chọn AI (BYOK)](#2-thiết-lập-ban-đầu--tùy-chọn-ai-byok)
3. [Quy Trình Check-in Hàng Ngày (15 Giây)](#3-quy-trình-check-in-hàng-ngày-15-giây)
4. [Hiểu Các Trạng Thái Xu Hướng & Cảnh Báo](#4-hiểu-các-trạng-thái-xu-hướng--cảnh-báo)
5. [Tương Tác Với Thẻ Can Thiệp Thông Minh](#5-tương-tác-với-thẻ-can-thiệp-thông-minh)
6. [Đọc Hiểu Biểu Đồ & Thống Kê Phục Hồi](#6-đọc-hiểu-biểu-đồ--thống-kê-phục-hồi)
7. [Mẹo Thực Hành & Câu Hỏi Thường Gặp (FAQ)](#7-mẹo-thực-hành--câu-hỏi-thường-gặp-faq)

---

## 1. Triết Lý & Nguyên Tắc Hoạt Động

### 🎯 Không trừng phạt (Non-Punitive UX)
- **Không có "Streak Tiêu Cực":** Hầu hết các ứng dụng thói quen khiến người dùng cảm thấy tội lỗi hoặc bỏ cuộc hẳn khi làm đứt một chuỗi ngày dài. Công cụ này **không dùng streak counter**, thay vào đó dùng chỉ số **Tỷ lệ che phủ (Consistency Coverage X/30 ngày)**.
- **Điểm số thấp là bình thường:** Điểm 3 hoặc 4 không phải là thất bại, mà là tín hiệu sinh học quý giá giúp hệ thống gợi ý giải pháp bảo vệ năng lượng của bạn.

### 🧠 Ma trận 2 chiều: Động Lực (Motivation) × Năng Lượng (Energy)
Hệ thống tách biệt rõ hai yếu tố:
- **Động Lực (Tinh thần / Ý chí):** Bạn có còn cảm thấy hào hứng, có ý nghĩa và muốn theo đuổi dự án không?
- **Năng Lượng (Thể chất / Sinh học):** Cơ thể bạn có đang sung sức hay kiệt quệ vì thiếu ngủ, làm việc quá sức?

| Tình huống | Biểu hiện | Can thiệp tối ưu từ hệ thống |
| :--- | :--- | :--- |
| **Năng lượng thấp ($\le 4$)** | Kiệt sức thể chất | **Nghỉ ngơi phục hồi (`take_break`)**: Chợp mắt, đi dạo, ngắt kết nối màn hình; không ép não bộ tư duy. |
| **Năng lượng cao ($\ge 7$) + Động lực thấp** | Tắc nghẽn nhận thức | **Chia nhỏ vi mô (`break_task`)**: Viết 1 dòng code, brain dump 10 phút, đặt micro-step. |
| **Sụt giảm đột ngột ($\ge 3.5$đ / 48h)** | Burnout cấp tính | **Dừng khẩn cấp**: Tạm hoãn deadline, rà soát lại khối lượng công việc. |
| **Vừa hoàn thành cột mốc** | Hụt hẫng sau thành tựu | **Ghi nhận & Tái định hướng (`celebrate_progress`)**: Vượt qua hiện tượng Thích ứng khoái lạc (*Hedonic Adaptation*). |

---

## 2. Thiết Lập Ban Đầu & Tùy Chọn AI (BYOK)

Ứng dụng hoạt động hoàn hảo ngay lập tức với **kho 32+ templates tâm lý học hành vi CBT** sẵn có. Tuy nhiên, nếu muốn lời khuyên được viết riêng theo ngữ cảnh dự án và ghi chú của bạn, bạn có thể kích hoạt tính năng AI:

1. Nhấp vào nút **`Gemini API Key`** (hoặc biểu tượng chìa khóa ở góc phải thanh điều hướng).
2. Nhập API Key của bạn (lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/)).
3. Bấm **Lưu cài đặt**.

> 🔒 **Bảo Mật Zero-Server Persistence:**
> - API Key chỉ được lưu trữ cục bộ trong trình duyệt của bạn (`localStorage`).
> - Key chỉ gửi trực tiếp qua Header HTTPS `x-gemini-api-key` khi bạn gửi check-in và **không bao giờ được ghi vào Database**.
> - Nếu không có key, nhập sai hoặc kết nối mạng chập chờn, hệ thống tự động fallback về kho 32 mẫu câu CBT chỉ trong < 1ms.

---

## 3. Quy Trình Check-in Hàng Ngày (15 Giây)

Thực hiện check-in mỗi ngày (hoặc mỗi khi bắt đầu/kết thúc phiên làm việc trên dự án):

1. **Chọn Dự Án:** Trên [Dashboard](file:///app/dashboard/page.tsx), chọn dự án bạn đang thực hiện.
2. **Kéo 2 Slider Cảm Xúc (Thang điểm 1 đến 10):**
   - **Mức Độ Động Lực:** Cảm giác muốn làm, nhiệt huyết với dự án hiện tại.
   - **Mức Năng Lượng:** Thể lực, độ tỉnh táo, mức pin sinh học trong cơ thể.
3. **Dùng Thẻ Ngữ Cảnh 1 Chạm (Quick Context Chips):**
   - Bấm chọn nhanh các tag phản ánh đúng hiện trạng mà không cần gõ phím:
     - `[Mất ngủ / Mệt mỏi]`
     - `[Task mơ hồ / Thiếu định hướng]`
     - `[Ngợp việc / Quá tải]`
     - `[Vừa xong cột mốc quan trọng]`
     - `[Mất tập trung / Xao nhãng]`
     - `[Vướng blocker kỹ thuật]`
4. **Ghi Chú Nhanh (Tùy chọn):** Viết 1-2 câu ngắn về điều đang cản trở hoặc điều vừa làm được.
5. **Bấm "Lưu Check-in".**

---

## 4. Hiểu Các Trạng Thái Xu Hướng & Cảnh Báo

Thuật toán của hệ thống sử dụng **Cửa sổ trượt 21 ngày gần nhất** (yêu cầu tối thiểu $\ge 5$ điểm check-in để đảm bảo tính chuẩn xác thống kê):

```
                     📈 Trend Status Badges
┌──────────────────┬──────────────────────┬───────────────────────────────────┐
│ Huy Hiệu (Badge) │ Ý Nghĩa Thống Kê     │ Đánh Giá & Hành Động              │
├──────────────────┼──────────────────────┼───────────────────────────────────┤
│ 🔴 Đang Suy Giảm │ Độ dốc slope ≤ -0.15 │ Xói mòn tiệm tiến; kích hoạt gợi  │
│    (Declining)   │                      │ ý can thiệp vi mô ngay lập tức.   │
├──────────────────┼──────────────────────┼───────────────────────────────────┤
│ 🟡 Biến Động     │ Độ lệch chuẩn σ ≥ 2.0│ Phong độ trồi sụt; cần điều chỉnh │
│    (Volatile)    │ và |slope| < 0.10    │ nhịp độ sinh hoạt & timeboxing.   │
├──────────────────┼──────────────────────┼───────────────────────────────────┤
│ 🔵 Ổn Định       │ |slope| < 0.15       │ Duy trì nhịp độ làm việc hiện tại.│
│    (Stable)      │                      │                                   │
├──────────────────┼──────────────────────┼───────────────────────────────────┤
│ 🟢 Đang Đi Lên   │ Độ dốc slope ≥ +0.10 │ Đà tiến bộ tốt; tiếp tục phát huy!│
│    (Improving)   │                      │                                   │
└──────────────────┴──────────────────────┴───────────────────────────────────┘
```

> ⚠️ **Cảnh Báo Cấp Tính (Acute Sudden Drop Alert):**
> Nếu điểm số của bạn tụt $\ge 3.5$ điểm trong vòng 48 giờ, hệ thống sẽ gắn cờ cảnh báo đỏ khẩn cấp. Lúc này, ưu tiên số 1 là dừng lại để tránh kiệt quệ hoàn toàn.

---

## 5. Tương Tác Với Thẻ Can Thiệp Thông Minh

Khi phát hiện bạn đang gặp khó khăn hoặc suy giảm động lực, thẻ **Can Thiệp Thông Minh (Smart Intervention Card)** sẽ tự động kích hoạt.

Mỗi can thiệp được cấu trúc chuẩn khoa học gồm 3 phần:
1. **Validation (Thừa nhận cảm xúc):** Giúp bạn nhận diện tình trạng bình thường hóa cảm xúc hiện tại.
2. **Insight (Góc nhìn tâm lý học):** Giải thích nguyên nhân gốc rễ (ví dụ: *Nghịch lý lựa chọn, Chi phí chìm, Hiệu ứng Zeigarnik, Thích ứng khoái lạc*).
3. **Action Step (Hành động vi mô 5-15 phút):** Một bước đi cực nhỏ, dễ thực hiện ngay lập tức để phá vỡ quán tính trì hoãn.

### 🔄 Vòng Lặp Học Hỏi & Tinh Chỉnh (Feedback Loop):
Dưới mỗi thẻ can thiệp, hãy gửi phản hồi cho hệ thống:
- Bấm **"👍 Hữu ích / Áp dụng tốt"**: Hệ thống sẽ tăng trọng số ($\times 2.0$) cho văn phong và hướng tiếp cận này trong những lần tiếp theo.
- Bấm **"👎 Không phù hợp / Đổi cách khác"**: Hệ thống giảm trọng số ($\times 0.2$) và tự động luân chuyển sang trường phái khác (*Hành động thực tế, Khoa học hành vi, hoặc Đồng cảm ấm áp*).
- **Cơ chế chống lặp lại (Anti-repetition window $k=3$):** Bạn sẽ không bao giờ bị gợi ý cùng một mẫu câu trong 3 lần can thiệp liên tiếp.

---

## 6. Đọc Hiểu Biểu Đồ & Thống Kê Phục Hồi

Khi bấm vào chi tiết một dự án, bạn sẽ theo dõi được:

### 1. Biểu Đồ Phân Tán & Đường Xu Hướng (Scatter & Trendline)
- **Các chấm tròn:** Điểm số check-in thực tế từng ngày.
- **Đường thẳng OLS (Đường xu hướng):** Chiều hướng phát triển thực tế. Nếu dốc xuống, bạn đang mất dần đà tâm lý mà bản thân có thể chưa nhận ra bằng trực giác.
- **Độ tin cậy $R^2$ (Confidence):** Phản ánh mức độ chuẩn xác của mô hình dự đoán.

### 2. Thẻ Đánh Giá Phục Hồi (Intervention Efficacy Card)
- **Chỉ số $\Delta_{recovery}$ (Delta Phục Hồi):** So sánh độ dốc trước và sau khi bạn nhận can thiệp.
- **Giao thức nâng cấp (Escalation Protocol):** Nếu can thiệp mức độ 1 (chia nhỏ task) chưa giúp điểm số phục hồi sau 3 lần check-in tiếp theo, hệ thống sẽ đề xuất đổi khung giờ làm việc hoặc tìm kiếm mentorship.

---

## 7. Mẹo Thực Hành & Câu Hỏi Thường Gặp (FAQ)

### 💡 Lời khuyên để đạt hiệu quả cao nhất:
1. **Thành thật tuyệt đối:** Bạn không cần phải thể hiện bản thân với ai. Điểm 2 hay 3 là cơ hội để công cụ hỗ trợ bạn.
2. **Chỉ làm bước vi mô:** Đừng cố làm 4 tiếng khi đang mệt; chỉ cần hoàn thành đúng hành động 5-10 phút mà can thiệp gợi ý.
3. **Check-in cố định khung giờ:** Tốt nhất là lúc bắt đầu ngày làm việc hoặc 10 phút trước khi rời bàn làm việc.

---

### ❓ Câu Hỏi Thường Gặp (FAQ):

**Q1: Dự án mới tạo có được phân tích ngay không?**
> Với dự án dưới 5 lượt check-in, hệ thống kích hoạt chế độ **Cold-Start Early Warmup**. Hệ thống sẽ tập trung hỗ trợ tạo đà khởi động (Tiny Habits / Kick-off Momentum) cho tới khi tích lũy đủ 5 điểm dữ liệu để vẽ đường hồi quy chuẩn xác.

**Q2: Tôi không nhập Gemini API Key thì công cụ có hoạt động không?**
> **Có, hoàn toàn đầy đủ!** Hệ thống tích hợp sẵn kho 32 mẫu câu CBT offline được phân loại kỹ lưỡng theo ma trận Động lực - Năng lượng, đảm bảo phản hồi tức thì mà không phụ thuộc vào internet hay AI bên ngoài.

**Q3: Tôi có thể xem lại lịch sử check-in ở đâu?**
> Tại trang chi tiết của từng dự án (`/projects/[id]`), kéo xuống mục lịch sử để xem lại tất cả các mốc điểm, tags ngữ cảnh và ghi chú bạn từng tạo.

---
*Chúc bạn luôn duy trì được ngọn lửa đam mê và sự bền bỉ với các mục tiêu dài hạn!*
