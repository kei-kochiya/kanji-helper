# ⛩️ Kanji Helper (漢字マスター)

> Web học chữ Hán (Kanji) toàn diện từ **JLPT N5 đến N1** với thiết kế hiện đại, dark mode tối giản, tra cứu tức thì, không AI slop, hỗ trợ âm Hán Việt, âm On/Kun, giải nghĩa tiếng Việt và ảnh động nét viết KanjiVG.

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
  - **Âm Kun (Kunyomi)**: Phiên âm Hiragana kèm dấu chấm ngăn cách okurigana (ví dụ: `よ.む`, `まな.ぶ`).
  - **Số nét & Bộ thủ**: Tên bộ thủ bằng tiếng Việt và số nét Hán tự.
  - **Từ vựng ví dụ (Jukugo)**: Các từ ghép thông dụng nhất chứa Hán tự đó.
- **Thứ tự nét viết (Stroke Order)**:
  - Tích hợp vector SVG từ **KanjiVG**.
  - Hoạt ảnh viết từng nét như cọ thật: nét được kéo dọc theo đúng hướng viết, nhịp chậm–nhanh–chậm, nghỉ giữa các nét, nét đang viết tô màu son rồi chuyển sang màu mực.
  - Thanh tiến trình chia theo từng nét (kéo để tua, phím mũi tên để đi từng nét), chỉnh tốc độ 0.5× / 1× / 2×, bật/tắt số thứ tự nét.
  - **Bảng luyện viết**: Tự viết theo ô chữ mễ (米字格) bằng chuột, ngón tay hoặc bút cảm ứng (nhận lực nhấn), có hoàn tác và đếm số nét so với số nét chuẩn.
- **Phát âm âm thanh (Audio Text-to-Speech)**:
  - Tích hợp Web Speech API (`ja-JP`) để nghe phát âm Kanji, âm On/Kun và từ ghép mẫu.
- **4 Chế độ học tập chuyên biệt**:
  1. **Thư viện (Explorer)**: Lưới tra cứu tốc độ 0ms, tìm kiếm đa năng (theo Kanji, Hán Việt, Kana, nghĩa Việt/Anh), gõ không dấu vẫn tìm được (`nhat` → NHẬT).
  2. **Thẻ nhớ (Flashcard)**: Học lật mặt thẻ 3D, hỗ trợ phím tắt Space/Mũi tên, đánh dấu thuộc / chưa thuộc.
  3. **Trắc nghiệm nâng cao (Quiz)**:
     - Tùy chọn nhiều dạng câu hỏi phong phú (chọn ít nhất 1 dạng, nhiều nhất tất cả):
       - *Kanji → Hán Việt & Nghĩa*
       - *Hán Việt → Kanji*
       - *Kunyomi → Kanji* (đảm bảo chỉ có 1 đáp án đúng trong 4 lựa chọn)
       - *Onyomi → Kanji* (đảm bảo chỉ có 1 đáp án đúng trong 4 lựa chọn)
       - *Kanji → Kunyomi* (ví dụ: `読` → `よ.む`)
       - *Kanji → Onyomi* (ví dụ: `学` → `ガク`)
     - Cài đặt giới hạn số câu hỏi (5, 10, 15, 20, 30, 50 câu).
     - Cho phép dừng sớm / thoát bất cứ lúc nào và hiển thị tổng kết bài làm chi tiết.
  4. **Luyện viết (Stroke Lab)**: Xem thứ tự nét chuẩn và tự viết lại ngay bên cạnh.
- **Lưu trữ tiến độ (Offline & LocalStorage)**:
  - Tự động lưu chữ đã thuộc, danh sách yêu thích (Bookmark).
  - Hỗ trợ **Export / Import tiến độ** dưới dạng tệp JSON.
- **Giao diện tông mực tàu**:
  - Nền mực ấm, chữ màu giấy, màu son cho nét đang viết và nút chính, màu vàng kim cho âm Hán Việt.
  - Font **Be Vietnam Pro** cho tiếng Việt, **Klee One** (kiểu chữ sách giáo khoa Nhật) cho chữ Hán lớn để thấy rõ cách viết, **Noto Sans JP** cho âm đọc.
  - Tôn trọng cài đặt giảm chuyển động (`prefers-reduced-motion`): không tự chạy hoạt ảnh, thẻ nhớ chuyển mờ thay vì lật.

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

## ⌨️ Phím tắt tiện ích (Keyboard Shortcuts)

| Phím | Chức năng |
| :--- | :--- |
| `/` | Đưa con trỏ nhanh vào ô tìm kiếm |
| `Space` | Lật mặt thẻ Flashcard |
| `←` / `→` | Chuyển thẻ Flashcard, chữ trong cửa sổ chi tiết hoặc trong Luyện viết |
| `S` | Phát âm âm thanh chữ Hán đang học |
| `1` `2` `3` `4` | Chọn đáp án trắc nghiệm trong chế độ Quiz |
| `Enter` | Chuyển sang câu hỏi trắc nghiệm tiếp theo |
| `←` / `→` (trên thanh tiến trình nét) | Lùi / tiến một nét |
| `Esc` | Đóng cửa sổ chi tiết chữ Hán |

---

## 📄 Bản quyền (License)

Mã nguồn được phân phối dưới giấy phép [MIT](LICENSE). Dữ liệu KanjiVG tuân thủ Creative Commons Attribution-Share Alike 3.0.
