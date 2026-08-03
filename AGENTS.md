<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Quy tắc thiết kế UI & Biên soạn tài liệu kiến trúc (Brain Center Rules)

## 1. Chuẩn hóa Ngôn ngữ & Thuật ngữ (No Jargon & No Emoji Clutter)
- **Không dùng thuật ngữ tiếng Anh khô cứng hay viết tắt mơ hồ**: Không dùng `IEEE 829`, `P1-P3`, `Step 1/2/3` trong mô tả sản phẩm. Chuyển thành Tiếng Việt tự nhiên dễ hiểu (ví dụ: "Kế hoạch kiểm thử tổng thể", "phân cấp độ ưu tiên: Cao / Trung bình / Thấp").
- **Không dùng Icon Emoji rác**: Tuyệt đối không dùng các icon trang trí gây rối mắt (như 🚀, 🛡️, 🎯, 🏢, 🟡, 🟧, 🟢, 🔷, 🔴, 📁, 📋, 📊, 🔍, ✨, 👤, 🔥, ✏️, 🗑️, 🚀, 📦). Giữ giao diện và văn bản tối giản, chuyên nghiệp.

## 2. Tiêu chuẩn Sơ đồ Mermaid (Diagram Standards)
- **Sơ đồ Mindmap**: Mỗi node con chỉ từ 2-4 từ ngắn gọn để tránh tràn viền hoặc đè lên hình tròn trung tâm `Brain Center`.
- **Sơ đồ Trình tự (Sequence Diagram)**:
  - Bắt buộc thêm `%%{init: {'theme': 'base', 'sequence': {'mirrorActors': false}}}%%` ở đầu để tắt hàng nhân vật lặp lại ở dưới.
  - Khi Agent trả dữ liệu về UI (`Agent -->> UI: Trả về...`), giao diện tự động hiển thị cho người dùng; KHÔNG tạo thêm mũi tên đứt nét thừa chỉ về phía User.
  - Sử dụng khối `loop` cho các quy trình phỏng vấn N vòng linh hoạt thay vì cố định số vòng.

## 3. Quy tắc Tích hợp Đa nguồn Tri thức (Multi-Source Context Alignment)
- Khi mô tả luồng tạo tài liệu (Doc Builder hay QA Pipeline), luôn đảm bảo hệ thống tham chiếu hợp nhất 4 nguồn tri thức:
  1. Lịch sử Q&A từ N vòng phỏng vấn.
  2. Ghi âm / Transcribe cuộc họp (Meeting Audio / Transcript).
  3. Ghi chú & văn bản thô (Raw Texts / Meeting Notes).
  4. Các tài liệu dự án liên quan được chọn (Selected Baseline Documents / Figma Links).

