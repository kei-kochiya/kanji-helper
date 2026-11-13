import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import { AppSkeleton } from './components/AppSkeleton';
import { LazyApp } from './LazyApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<AppSkeleton />}>
      <LazyApp />
    </Suspense>
    <Analytics />
  </StrictMode>
);
