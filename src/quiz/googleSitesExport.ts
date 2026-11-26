import { DEFAULT_QUIZ_SETTINGS } from './questions';
import { FIREBASE_APP_ID, FIREBASE_CONFIG } from './firebaseSync';
import { GOOGLE_SITES_BODY_MARKUP } from './googleSitesMarkup';
import { buildGoogleSitesScripts } from './googleSitesScripts';
import { GOOGLE_SITES_HEAD_ASSETS } from './googleSitesStyles';
import type { Question, QuizSettings } from './types';

function safeJsonForHtmlScript(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/<\/script/gi, '<\\/script');
}

/**
 * Generates a self-contained single-file HTML document ready for Google Sites
 * ("Embed -> Embed Code") or direct GitHub Pages upload (`index.html`), matching
 * the full React application's interactive UI, Web Audio SFX, 3-2-1 countdown,
 * dynamic categories, rooms, image illustrations, keyboard shortcuts, and
 * 3-tab Admin Dashboard (excluding Publish & Embed).
 */
export function generateGoogleSitesHtml(
  questions: Question[],
  settings: QuizSettings = DEFAULT_QUIZ_SETTINGS,
  roomCode: string = ''
): string {
  const serializedQuestions = safeJsonForHtmlScript(questions);
  const serializedConfig = safeJsonForHtmlScript(FIREBASE_CONFIG);
  const serializedSettings = safeJsonForHtmlScript({
    ...DEFAULT_QUIZ_SETTINGS,
    ...settings,
  });
  const scripts = buildGoogleSitesScripts(
    serializedQuestions,
    serializedConfig,
    FIREBASE_APP_ID,
    serializedSettings,
    roomCode
  );

  return `<!DOCTYPE html>
<html lang="id">
<head>
${GOOGLE_SITES_HEAD_ASSETS}
</head>
${GOOGLE_SITES_BODY_MARKUP}
${scripts}
</html>
`;
}
