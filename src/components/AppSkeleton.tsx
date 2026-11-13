import React from 'react';

/** First paint while the app code and kanji data load: the real header shape and empty card slots. */
export const AppSkeleton: React.FC = () => (
  <div className="min-h-screen flex flex-col" aria-busy="true">
    <header className="border-b border-line bg-ink-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2.5">
        <span lang="ja" aria-hidden="true" className="grid place-items-center w-8 h-8 rounded-md bg-shu-600 text-white font-kanji text-lg leading-none">
          漢
        </span>
        <span className="font-semibold text-paper">Kanji Helper</span>
      </div>
    </header>
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
      <div className="h-[7.5rem] rounded-2xl bg-ink-900 border border-line mb-6" />
      <p className="sr-only" role="status">
        Đang tải dữ liệu chữ Hán…
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {Array.from({ length: 18 }, (_, i) => (
          <div key={i} className="h-[9.5rem] rounded-xl bg-ink-900 border border-line" />
        ))}
      </div>
    </main>
  </div>
);
