# Kanji Helper — Product Context

## Purpose
Kanji Helper is a fast, distraction-free web study companion for Vietnamese learners studying Japanese Kanji across JLPT N5–N1 (2,383 Jōyō & JLPT characters).

## Core Audience & Workflows
- **Explorer (`/`):** Instant client-side search across Kanji, Hán Việt (including accentless Vietnamese input like `nhat` → `NHẬT`), Hiragana/Katakana On/Kun readings, Vietnamese/English meanings, and Jukugo vocabulary; filterable by JLPT levels, mastery/bookmark status, and radical.
- **Detail Modal (`/?chu=<kanji>`):** Animated KanjiVG brush-order playback, audio pronunciation (Web Speech API `ja-JP`), Hán Việt, On/Kun readings, radical filtering, and enriched Jukugo examples with reading, Hán Việt, and Vietnamese meaning.
- **Flashcards (`/the-nho`):** 3D flip cards (crossfading under `prefers-reduced-motion`) with keyboard shortcuts (`Space`, `←`, `→`, `S`), deck shuffle, and mastery/bookmark tracking.
- **Quiz (`/trac-nghiem`):** Configurable multi-format quiz without duplicate targets, distractors matched on okurigana shape, missed-kanji retry flow, and direct mastery tagging.
- **Stroke Lab (`/luyen-viet`):** Side-by-side KanjiVG reference player and interactive writing canvas with guided stroke-order/direction checking (`Chấm nét`) and freehand (`Tự do`) modes.

## Technical Constraints
- Fully static SPA deployed on Vercel (`@vercel/analytics` enabled); no backend required.
- Progress and filter preferences persist in `localStorage` with JSON export/import.
- Stroke SVGs ship under `public/strokes/<code>.json` with zero CDN dependency.
