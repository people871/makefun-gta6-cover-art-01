// Boots the studio: build the editor, then either play a fixed ?shot=
// scene for screenshots or load the built-in samples and paint. Once the
// first paint lands, window.__coverAppReady is true for test harnesses.
import { createStudio } from './editor.js';
import { runShot } from './shots.js';

const studio = createStudio(document);
window.__coverApp = studio;

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, studio);
} else {
  studio.loadSamples().then(() => { window.__coverAppReady = true; });
}
