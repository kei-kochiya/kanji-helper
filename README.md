# ⛩️ Kanji Helper (漢字マスター)

> Web học chữ Hán (Kanji) toàn diện từ **JLPT N5 đến N1** với thiết kế hiện đại, dark mode tối giản, tra cứu tức thì, không AI slop, hỗ trợ âm Hán Việt, âm On/Kun, giải nghĩa tiếng Việt và ảnh động nét viết KanjiVG.

[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Kanji Count](https://img.shields.io/badge/Kanji%20Count-2%2C383%20Chars-emerald)](src/data/kanji_data.json)

---

## ✨ Điểm nổi bật (Features)

- **Đầy đủ 100% từ N5 đến N1 (2,383 Hán tự chuẩn JLPT & Thường dụng Joyo Kanji)**:
  - **N5**: 84 chữ cơ bản
  - **N4**: 169 chữ sơ cấp
  - **N3**: 387 chữ trung cấp
  - **N2**: 398 chữ trung-cao cấp
  - **N1**: 1,345 chữ cao cấp
- **Bộ lọc linh hoạt (Gộp nhiều Level cùng lúc)**:
  - Chọn một hoặc kết hợp nhiều cấp độ cùng lúc (ví dụ: `N5 + N4`, hoặc `N3 + N2 + N1`, hoặc `Tất cả`).
- **Thông tin chi tiết chuẩn xác**:
  - **Âm Hán Việt**: Hiển thị nổi bật in hoa (**HỌC**, **NHẬT**, **SINH**...) giúp ghi nhớ từ ghép (Jukugo) siêu nhanh.
  - **Nghĩa tiếng Việt**: Giải nghĩa Hán Nôm chi tiết kèm nghĩa tiếng Anh đối chiếu.
  - **Âm On (Onyomi)**: Phiên âm Katakana chuẩn.
  - **Âm Kun (Kunyomi)**: Phiên âm Hiragana kèm đánh dấu Okurigana.
  - **Số nét & Bộ thủ**: Tên bộ thủ bằng tiếng Việt và số nét Hán tự.
  - **Từ vựng ví dụ (Jukugo)**: Các từ ghép thông dụng nhất chứa Hán tự đó.
- **Thứ tự nét viết (Stroke Order)**:
  - Tích hợp vector SVG từ **KanjiVG**.
  - Xem hoạt ảnh từng nét viết, tạm dừng, tua lại, bật/tắt đánh số thứ tự nét.
  - **Bảng vẽ Canvas**: Cho phép tự tay luyện viết theo ô kẻ mễ (Mizukiri) bằng chuột hoặc màn hình cảm ứng.
- **Phát âm âm thanh (Audio Text-to-Speech)**:
  - Tích hợp Web Speech API (`ja-JP`) để nghe phát âm Kanji, âm On/Kun và từ ghép mẫu.
- **4 Chế độ học tập chuyên biệt**:
  1. **Thư viện (Explorer)**: Lưới tra cứu tốc độ 0ms, tìm kiếm đa năng (theo Kanji, Hán Việt, Romaji, Kana, nghĩa).
  2. **Thẻ nhớ Flashcard (SRS)**: Học lật mặt thẻ 3D, hỗ trợ phím tắt Space/Mũi tên, đánh dấu thuộc / chưa thuộc.
  3. **Trắc nghiệm (Quiz)**: Câu hỏi 4 lựa chọn sinh tự động từ bộ lọc, tính điểm, chuỗi streak và hiệu ứng ăn mừng.
  4. **Luyện viết nét (Stroke Lab)**: Trực quan hóa thứ tự nét và thực hành vẽ trực tiếp trên canvas.
- **Lưu trữ tiến độ (Offline & LocalStorage)**:
  - Tự động lưu chữ đã thuộc, danh sách yêu thích (Bookmark).
  - Hỗ trợ **Export / Import tiến độ** dưới dạng tệp JSON.
- **Giao diện Pro Max (Developer-grade Dark UI)**:
  - Thiết kế tông tối dịu mắt (`#090a0f`), viền nét tinh tế, font tiếng Nhật chuẩn xác.
  - Không bloatware, không hiệu ứng rườm rà, tải toàn bộ web chỉ trong ~300KB gzip.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vitejs.dev/) (Build siêu tốc < 1s)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Nguồn dữ liệu uy tín**:
  - `OpenJLPT`: Danh mục phân bổ cấp độ Kanji JLPT N5–N1
  - `KanjiDictVN` (trungnt2910): Cơ sở dữ liệu âm Hán Việt và giải nghĩa Hán Nôm
  - `KanjiVG`: Vector chuẩn thứ tự các nét viết Hán tự Nhật Bản

---

## 🚀 Cài đặt & Chạy cục bộ (Local Development)

```bash
# 1. Clone repository
git clone https://github.com/kei-kochiya/kanji-helper.git
cd kanji-helper

# 2. Cài đặt thư viện
npm install

# 3. Chạy server phát triển
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.

---

## ☁️ Hướng dẫn Deploy lên Vercel (1-Click Deploy)

Dự án đã được cấu hình sẵn tệp `vercel.json` phục vụ Single Page Application (SPA), bạn có thể deploy lên Vercel cực kỳ đơn giản:

### Cách 1: Kết nối Vercel với GitHub (Khuyên dùng)
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Nhấn **"Add New Project"** -> Chọn repository **`kei-kochiya/kanji-helper`**.
3. Vercel sẽ tự động phát hiện cấu hình **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Nhấn **"Deploy"** — Chỉ mất khoảng 20 giây là trang web sẽ online với tên miền miễn phí dạng `kanji-helper.vercel.app` (hỗ trợ HTTPS và CDN toàn cầu).

### Cách 2: Deploy bằng Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## ⌨️ Phím tắt tiện ích (Keyboard Shortcuts)

| Phím | Chức năng |
| :--- | :--- |
| `/` | Đưa con trỏ nhanh vào ô tìm kiếm |
| `Space` | Lật mặt thẻ Flashcard |
| `←` / `→` | Chuyển thẻ Flashcard trước / sau |
| `S` | Phát âm âm thanh chữ Hán đang học |
| `1` `2` `3` `4` | Chọn đáp án trắc nghiệm trong chế độ Quiz |
| `Enter` | Chuyển sang câu hỏi trắc nghiệm tiếp theo |
| `Esc` | Đóng cửa sổ chi tiết chữ Hán |

---

## 📄 Bản quyền (License)

Mã nguồn được phân phối dưới giấy phép [MIT](LICENSE). Dữ liệu KanjiVG tuân thủ Creative Commons Attribution-Share Alike 3.0.
