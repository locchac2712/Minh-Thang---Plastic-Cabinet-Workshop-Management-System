---
name: fe-reviewer
description: >
  Review và phân tích chất lượng code frontend của dự án MT-PCWMS (Minh Thang Plastic Cabinet Workshop Management System).
  Kích hoạt khi người dùng nói "review component này", "kiểm tra file này", "đánh giá trang này", "xem lại phần FE",
  "có vấn đề gì không", hoặc bất kỳ yêu cầu nào muốn nhận xét / phân tích một file TSX, CSS hoặc một tính năng frontend.
  Luôn dùng skill này khi được yêu cầu xem xét, đánh giá chất lượng bất kỳ thành phần nào của frontend.
---

# FE Reviewer — MT-PCWMS

Skill này giúp review và phân tích chất lượng code frontend theo đúng convention của dự án **Minh Thang Plastic Cabinet Workshop Management System**.

Kết quả review chỉ là **nhận xét / phân tích bằng text** — không sửa code trực tiếp.

---

## Convention cốt lõi của dự án

> **Ưu tiên tối đa Ant Design cho UI component. Dùng Tailwind CSS cho layout, spacing và custom style. Hạn chế tối đa viết file CSS riêng.**

Dự án dùng `AntdAppProvider` (`src/shared/ui/antd/AntdAppProvider.tsx`) bọc toàn bộ app với:
- `ConfigProvider` — theme token (màu, font Inter, border-radius) đồng bộ với CSS variables và Tailwind theme.
- `AntdApp` — cung cấp `message`, `notification`, `modal` dùng được ở mọi nơi.

### Design System & Typography
- **Font chữ:** Sử dụng **Inter** cho toàn bộ ứng dụng.
- **Tailwind CSS v4:** Sử dụng trực tiếp các class của Tailwind (v4) để căn chỉnh layout, khoảng cách, màu sắc.
- **Liquid Glass:** Sử dụng class `.liquid-glass` cho các hiệu ứng kính mờ (glassmorphism) cao cấp.

Theme được cấu hình tại `antdThemeBridge.ts`, đọc các CSS custom property (`--th-font-sans`, `--th-text-*`, `--th-weight-*`) và map sang Ant Design token.

---

## Bước 1: Xác định phạm vi review

Trước khi phân tích, xác định người dùng muốn review cái gì:
- **File cụ thể** → đọc file `.tsx` + file `.css` cùng tên (nếu còn tồn tại)
- **Tính năng / trang** → đọc page component + các file liên quan được import
- **Toàn bộ module** → đọc lần lượt từng page, nhận xét tổng thể

Nếu chưa rõ, hỏi: _"Bạn muốn review file nào / tính năng nào cụ thể?"_

---

## Bước 2: Đọc context cần thiết

Trước khi nhận xét, luôn đọc:
1. File `.tsx` chính được chỉ định
2. File `.css` cùng tên (nếu có — sự tồn tại của file CSS lớn là dấu hiệu cần xem xét)
3. `src/shared/ui/antd/AntdAppProvider.tsx` và `antdThemeBridge.ts` nếu review liên quan đến theme/style

---

## Bước 3: Phân tích theo các tiêu chí

### A. Ant Design — Tiêu chí QUAN TRỌNG NHẤT

**Nguyên tắc: Mọi UI element phải được xây bằng Ant Design component. Chỉ viết CSS khi không có cách nào khác.**

Kiểm tra các element phổ biến — báo cáo là vấn đề nếu dùng bản tự làm thay vì Ant Design:

| Nên dùng (Ant Design) | Không nên dùng (tự làm) |
|---|---|
| `<Button>`, `<Button type="primary">`, `<Button danger>` | `<button>` + CSS tùy ý |
| `<Input>`, `<Input.Search>`, `<Input.Password>` | `<input>` + CSS tùy ý |
| `<Select>` | `<select>` native |
| `<Table columns={...} dataSource={...}>` | `<table><thead><tbody>` tự viết |
| `<Form>`, `<Form.Item rules={...}>` | form state + validation thủ công |
| `<Modal>` hoặc `<Drawer>` | `<dialog>` native + CSS |
| `<Tag>`, `<Badge>` | `<span>` với class badge tự viết |
| `<Spin>` | Loading state + div tự viết |
| `<Empty>` | Empty state tự viết |
| `<Space>`, `<Flex>` | `display: flex` + CSS |
| `<Pagination>` | Pagination tự viết |
| `message.success()`, `message.error()` từ `App.useApp()` | Notice/toast dùng state + div |
| `<Popconfirm>` hoặc `modal.confirm()` từ `App.useApp()` | Dialog xác nhận tự viết |
| `<Tooltip>` | Tooltip tự làm |
| `<Tabs>` | Tab navigation tự làm |
| `<DatePicker>` | Input date tự làm |
| `<Upload>` | File input tự làm |

**Cờ đỏ — báo cáo ❌ Vấn đề cần sửa:**
- File `.css` riêng với nhiều rule (>30 dòng) khi đa số có thể thay bằng Ant Design prop hoặc Tailwind class.
- Dùng `<button>` native thay vì `<Button>` antd.
- Dùng `<input>` / `<select>` native thay vì `<Input>` / `<Select>` antd.
- Dùng `<dialog>` native thay vì `<Modal>` hoặc `<Drawer>`.
- Tự quản lý loading state thay vì dùng `loading` prop của Ant Design.
- Notice/toast dùng state + div thay vì `message` / `notification` từ `App.useApp()`.
- Tự viết pagination thay vì `<Pagination>` antd.

**Được phép — không phải vấn đề:**
- Sử dụng **Tailwind CSS classes** để tinh chỉnh layout, border, shadow, spacing.
- CSS cho layout page-level phức tạp không có Ant Design tương đương.
- CSS override Ant Design (`.ant-*` hoặc `:where`) khi cần fine-tune không thể qua theme token.
- Sử dụng class `.liquid-glass` cho hiệu ứng kính mờ.
- CSS utility nhỏ như `.th-num-tabular`, visually-hidden helper.
- File `index.css` với Tailwind configuration và design tokens.

### B. Cấu trúc & Tổ chức file

Kiểm tra:
- File page component đặt đúng thư mục module? (`admin/pages/`, `seller/pages/`...)
- Các type/interface khai báo trước component function?
- Các hàm helper khai báo ngoài component?
- Nếu có file `.css` riêng: số lượng rule có thực sự cần thiết không?

### C. Đặt tên (Naming Convention)

Kiểm tra TypeScript:
- Type/interface: PascalCase (`StaffRow`, `ApiEnvelope<T>`)
- State variables: camelCase mô tả rõ (`filterRole`, `searchQuery`)
- Handler: prefix `handle` (`handleSubmit`, `handleDelete`)
- Hàm mở/đóng modal: tên rõ ràng (`openAddModal`, `closeDetailModal`)

Nếu vẫn còn CSS: kiểm tra prefix `th-` cho mọi class (không dùng class chung như `.btn`, `.table`).

### D. Quản lý State & Logic

Kiểm tra:
- Có dùng `useCallback` cho handler phức tạp không?
- Có dùng `useId()` cho form element ID không?
- `useEffect` có dependency array đúng không?
- Có tránh state dư thừa (có thể derive từ state khác)?
- Khi dùng `<Form>` của antd: có dùng `form.validateFields()` thay vì validation thủ công?

### E. Gọi API & Xử lý lỗi

Kiểm tra:
- `API_BASE_URL` lấy từ `import.meta.env.VITE_API_BASE_URL` với fallback không?
- Kiểm tra `accessToken` trước khi gọi API?
- Dùng `ApiEnvelope<T>` wrapper để parse response?
- Xử lý cả `!res.ok` lẫn `!envelope.success`?
- Error hiển thị qua `message.error()` từ `App.useApp()` — không phải tự quản lý state?
- Loading state có thể dùng `loading` prop của Ant Design thay vì `useState` riêng không?

### F. Accessibility (nếu còn dùng HTML native)

Nếu vẫn còn element HTML native (không phải antd), kiểm tra:
- Button native: có `type="button"` tường minh?
- Icon: có `aria-hidden`?
- Bảng native: có `aria-label`, `scope="col"`?
- Toast/notice: có `role="status"` và `aria-live`?

> Ant Design component đã xử lý phần lớn accessibility — đây là thêm một lý do nên dùng antd.

---

## Bước 4: Áp dụng lý thuyết UX/UI (Bổ sung mới)

Khi review, hãy kiểm tra xem component có tuân thủ các nguyên lý UX/UI sau không:

### 1. Luật Fitts (Fitts' Law)
- Các mục tiêu quan trọng (như nút Logout, nút Toggle) có kích thước đủ lớn và dễ click không?
- Khoảng cách giữa các item trong Menu có đủ rộng để tránh click nhầm (fat finger) không?

### 2. Luật Hick (Hick's Law)
- Menu có quá nhiều item không? Nếu có >7 item, hãy gợi ý phân nhóm (Grouping) hoặc dùng Accordion/Sub-menu để giảm tải nhận thức (cognitive load).

### 3. Phân cấp thị giác (Visual Hierarchy)
- Mục hiện tại (Active state) có nổi bật rõ rệt không (High contrast)?
- Các nhóm (Groups) có tiêu đề rõ ràng để phân tách không?
- Độ tương phản (Contrast ratio) của text trên nền tối (Dark mode) có đạt chuẩn WCAG (thường > 4.5:1) không?

### 4. Phản hồi tức thì (Immediate Feedback)
- Hover state, Active state, và Loading state có mượt mà không?
- Có hiệu ứng transition/animation khi đóng/mở sidebar không?

### 5. Tính nhất quán (Consistency)
- Icon có cùng style (Material Symbols Outlined) và kích thước không?
- Màu sắc có tuân thủ palette của dự án (Slate/Cyan cho Admin, các màu khác cho các role khác) không?

---

## Bước 5: Format kết quả review

```
## Review: [Tên file / Tính năng]

### Điểm tốt
[Những gì dùng đúng Ant Design, code sạch, logic tốt]

### Cần chú ý
[Những điểm chưa tối ưu, còn tự viết CSS không cần thiết]
- [vấn đề] → [gợi ý thay thế bằng Ant Design component nào]

### Vấn đề cần sửa
[Vi phạm convention "ưu tiên Ant Design", có thể gây bug, hoặc duplicate work]
- [vấn đề cụ thể (dòng X)] → [Ant Design component thay thế + cách dùng ngắn gọn]

### Tóm tắt
[Đánh giá mức độ tuân thủ convention Ant Design, tỉ lệ CSS tự viết so với cần thiết, ưu tiên refactor]
```

---

## Lưu ý khi review

- **Không sửa code** — chỉ nhận xét bằng text, bằng **tiếng Việt**
- Ưu tiên nhận xét: vi phạm "dùng Ant Design" → lỗi logic → style/naming nhỏ
- Tham chiếu dòng code cụ thể khi có thể ("dòng 83, nên thay `<button>` bằng `<Button>` của antd")
- Nếu file lớn (>400 dòng): chia thành phần Logic, UI Components, CSS
- Khi thấy file `.css` lớn bên cạnh `.tsx`, đây thường là dấu hiệu cần refactor sang Ant Design
