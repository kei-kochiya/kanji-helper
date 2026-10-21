import type { UserProgress } from '../types/kanji';

const STORAGE_KEY = 'kanji_master_progress_v1';

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        starred: Array.isArray(parsed.starred) ? parsed.starred : [],
        mastered: Array.isArray(parsed.mastered) ? parsed.mastered : [],
        quizHighScore: typeof parsed.quizHighScore === 'number' ? parsed.quizHighScore : 0,
      };
    }
  } catch (e) {
    console.error('Failed to parse user progress from localStorage', e);
  }
  return {
    starred: [],
    mastered: [],
    quizHighScore: 0,
  };
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress', e);
  }
}

export function exportProgressJSON(progress: UserProgress): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(progress, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `kanji_progress_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importProgressJSON(file: File): Promise<UserProgress> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && Array.isArray(parsed.starred) && Array.isArray(parsed.mastered)) {
          resolve({
            starred: parsed.starred,
            mastered: parsed.mastered,
            quizHighScore: parsed.quizHighScore || 0,
          });
        } else {
          reject(new Error('Định dạng tệp không hợp lệ'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
