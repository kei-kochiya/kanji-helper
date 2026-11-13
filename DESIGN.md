# Kanji Helper — Design System

## Aesthetic Direction: Mực tàu (Ink & Paper)
A calm, high-contrast dark study surface inspired by Japanese calligraphy ink, warm handmade paper, vermilion seal stamps, and gold Hán Việt annotations.

## Color Tokens (`src/index.css`)
- **Surfaces:** `--color-ink-950` (`#0f0e0c` ground), `--color-ink-900` (`#161411` elevated cards/dialogs), `--color-ink-850` (`#1d1b17` hover/interactive), `--color-ink-800` (`#26231e` active states), `--color-ink-700` (`#35312a` subtle guides/scrollbars).
- **Hairlines:** `--color-line` (`rgb(237 231 221 / 0.08)`), `--color-line-strong` (`rgb(237 231 221 / 0.16)`).
- **Text:** `--color-paper` (`#ede7dd` primary), `--color-paper-2` (`#bdb5a8` secondary), `--color-paper-3` (`#958d80` muted).
- **Accents:** `--color-shu` (`#ef6b4c` active stroke, focus ring, caret), `--color-shu-600` (`#c4462a` primary button/seal), `--color-kin` (`#e3b155` Hán Việt readings & bookmarks), `--color-ok` (`#86c99a` mastered/correct), `--color-bad` (`#ee8274` missed/needs practice).
- **JLPT Levels:** `--color-n5` (`#8fc79b`), `--color-n4` (`#82b8d4`), `--color-n3` (`#a3aee6`), `--color-n2` (`#cfa2d6`), `--color-n1` (`#e8938a`).

## Typography & Accessibility Floor
- **UI (Vietnamese):** `Be Vietnam Pro`
- **Kanji Display:** `Klee One` (textbook script)
- **Japanese Readings & Compounds:** `Noto Sans JP`
- **Minimum body/metadata size:** `12px` (`text-xs`); never drop below `12px`.
- **Contrast:** Keep WCAG AA (`>= 4.5:1`) on all labels and selected chips (avoid lowering opacity on colored text over tinted backgrounds).
- **Motion:** Honor `prefers-reduced-motion` with opacity crossfades and disabled confetti/autoplay.
