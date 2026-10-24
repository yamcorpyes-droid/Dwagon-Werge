'use strict';

/* ==========================================================================
   BOOT: wire up the buttons, load the save, start the frame loop
   ========================================================================== */
$('helpBtn').onclick = () => showOverlay('helpOverlay');
$('advBtn').onclick = openMap;
$('marketBtn').onclick = () => { renderMarket(); showOverlay('marketOverlay'); };
$('storageBtn').onclick = () => { renderStorage(); showOverlay('storageOverlay'); };
$('bookBtn').onclick = () => { renderBook(); showOverlay('bookOverlay'); };
$('dwBookBtn').onclick = () => { renderDwagonBook(); showOverlay('dwBookOverlay'); };
$('hintBtn').onclick = hint;
$('leaveLevelBtn').onclick = () => enterWorld('camp');
$('finishBtn').onclick = finishLevel;
$('finishLevelBtn').onclick = () => { $('levelOverlay').classList.remove('show'); finishLevel(); };
$('levelStayBtn').onclick = () => {
  $('levelOverlay').classList.remove('show');
  if ($('levelOverlay').dataset.then === 'editor') { delete $('levelOverlay').dataset.then; openEditor(); }
};
// the level editor is hidden: tap the game's title 5 times quickly (or open the page with #editor)
let titleTaps = [];
document.querySelector('h1').addEventListener('click', () => {
  const t = Date.now();
  titleTaps = titleTaps.filter(x => t - x < 2500).concat(t);
  if (titleTaps.length >= 5) { titleTaps = []; openEditor(); }
});
$('soundBtn').onclick = () => { Sound.muted = !Sound.muted; Sound.ensure(); updateSoundBtn(); save(); };
$('zoomIn').onclick = () => zoomAt(view.w / 2, view.h / 2, cam.z * 1.25);
$('zoomOut').onclick = () => zoomAt(view.w / 2, view.h / 2, cam.z / 1.25);
$('zoomHome').onclick = homeView;
$('resetBtn').onclick = () => {
  if (confirm('Start a brand-new game? ALL progress (camp and Adventures) will be replaced.')) {
    newGame(); save(); updateHud(); updateInfo();
  }
};
$('exportBtn').onclick = exportSave;
$('importBtn').onclick = () => $('importFile').click();
$('importFile').onchange = (e) => {
  if (e.target.files[0]) importSave(e.target.files[0]);
  e.target.value = '';   // allow picking the same file again
};

/* ---- Installable offline app ---- */
// Service workers only run on https:// (or localhost while testing); opened from a
// plain folder the game still works, just without the offline install.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
// ask the browser not to clear the save when the tablet runs low on space
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  $('installBtn').hidden = false;
});
$('installBtn').onclick = async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice.catch(() => {});
  installPrompt = null;
  $('installBtn').hidden = true;
};
window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; toast('📲 Installed! Find Dwagon Merge on your home screen.'); });

new ResizeObserver(resize).observe(stage);
resize();
newGame();
if (!load()) {
  showOverlay('helpOverlay');   // first visit
  save();
}
updateSoundBtn();
updateHud();
updateInfo();
requestAnimationFrame(frame);
if (location.hash === '#editor') openEditor();
