// Fixed scenes for screenshots: ?shot=editor shows the studio with a sample
// photo loaded; ?shot=cover shows one exported-size cover alone, so the
// screenshot is the app's own drawing at a reproducible size.
// Params: photo=pier|boulevard, caption, subtitle, layout, grade, size.
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, studio) {
  const photo = query.get('photo') || 'pier';
  const caption = query.get('caption') || 'Neon Coast';
  const subtitle = query.get('subtitle') || 'vice city nights';
  const layout = query.get('layout') || 'hero-three';
  const grade = query.get('grade') || 'sunset';
  const size = query.get('size') || 'wide';

  studio.setCaption(caption);
  studio.state.subtitle = subtitle;
  const sub = document.getElementById('subtitle');
  if (sub) sub.value = subtitle;
  studio.setLayout(layout);
  studio.setGrade(grade);
  studio.setSize(size);

  if (shot === 'cover') document.body.classList.add('shot-cover');
  await studio.loadSamples();
  if (photo === 'boulevard') studio.state.slots.forEach((s) => { s.photo = 1; });
  await studio.render();
  document.title = `${caption} — Neon Coast Cover Studio`;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
