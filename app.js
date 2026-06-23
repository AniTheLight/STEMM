/**
 * STEMM Archives — app.js
 *
 * All interactive logic for the multi-screen site:
 *   main (green/bros) → password → cool (pink/sisters) → tab pages
 */

// ===== IMAGE ASSETS =====
const IMAGES = {
  PW_BG:    'uploads/pw_bg.png',          // password screen background
  WRONG:    'uploads/wrong.png',           // wrong-answer image
  BROS:     'uploads/bros_side.png',       // second-wrong-answer image
  COOLDOWN: 'uploads/cooldown_img.png',    // locked-out image
  CORRECT:  'uploads/correct_img.png',     // success overlay
  MAIN_BG:  'uploads/main_bg.png',         // green screen lower strip
  PINK_BG:  'uploads/pink_bg.png',         // cool/pink full background
  TAB_DK:   'uploads/tab_dk.png',
  TAB_YK:   'uploads/tab_yk.png',
  TAB_FK:   'uploads/tab_fk.png',
  FOLDER:   'uploads/folder_front.png',
};

// ===== TAB DEFINITIONS =====
const TABS = {
  DK: { origin: 'main', color: '#3f6b4e' },
  YK: { origin: 'main', color: '#9c3b3b' },
  FK: { origin: 'main', color: '#5b3f8c' },
  MQ: { origin: 'cool', color: '#6b4fae' },
  SI: { origin: 'cool', color: '#8a5fb0' },
};

// ===== SUPABASE CONFIG =====
// Fill these in when the project is deployed.
const SUPABASE = { url: '', anonKey: '', fnName: 'verify-password' };

// ===== DEMO PASSWORD (fallback when Supabase is not configured) =====
const DEMO_PASSWORD = 'hayamaxxing';

// ===== COOLDOWN SETTINGS =====
const COOLDOWN_MINUTES = 5;
const MAX_ATTEMPTS     = 3;

// ===== BUBBLE CONFIG =====
const BUBBLE_COUNT = 28;

// ==================== STATE ====================
let state = {
  view:          'main',   // 'main' | 'cool' | 'password' | 'DK' | 'YK' | 'FK' | 'MQ' | 'SI'
  phase:         'idle',   // 'idle' | 'correct' | 'bubbles'
  attempts:      0,
  cooldownUntil: 0,
  videoOpen:     false,
  pwValue:       '',
  shaking:       false,
  animating:     false,
  hoveredTab:    null,
};

// Restore persisted cooldown / attempt count
try {
  const cu = parseInt(localStorage.getItem('si_cooldown') || '0', 10) || 0;
  const at = parseInt(localStorage.getItem('si_attempts') || '0', 10) || 0;
  if (Date.now() < cu) {
    state.cooldownUntil = cu;
    state.attempts      = at;
  }
} catch (_) {}

// ==================== BUBBLE SPRITES ====================
const bubbles = Array.from({ length: BUBBLE_COUNT }, () => ({
  left:  Math.random() * 100,
  size:  16 + Math.random() * 50,
  dur:   2  + Math.random() * 1.8,
  delay: Math.random() * 1.0,
}));

// ==================== DOM REFS ====================
const $ = (id) => document.getElementById(id);

const screens = {
  main:     $('screen-main'),
  cool:     $('screen-cool'),
  password: $('screen-password'),
  tab:      $('screen-tab'),
};

const els = {
  // main
  mainInner:    $('main-inner'),
  tabImgDK:     $('tab-img-dk'),
  tabImgYK:     $('tab-img-yk'),
  tabImgFK:     $('tab-img-fk'),
  folderFront:  $('folder-front'),
  mainBgImg:    $('main-bg-img'),

  // cool
  coolInner:    $('cool-inner'),
  coolBgImg:    $('cool-bg-img'),

  // password
  pwInner:      $('pw-inner'),
  pwBgImg:      $('pw-bg-img'),
  pwInput:      $('pw-input'),
  cooldownText: $('cooldown-text'),

  // tab placeholder
  tabInner:     $('tab-inner'),
  tabLabel:     $('tab-label'),
  tabLabel2:    $('tab-label-2'),
  tabDropZone:  $('tab-drop-zone'),

  // overlays
  successOverlay: $('success-overlay'),
  successImg:     $('success-img'),
  videoModal:     $('video-modal'),
  videoIframe:    $('video-iframe'),
  bubbleLayer:    $('bubble-layer'),
};

// ==================== PERSIST ====================
function persist(attempts, cooldownUntil) {
  try {
    localStorage.setItem('si_attempts',  String(attempts));
    localStorage.setItem('si_cooldown',  String(cooldownUntil));
  } catch (_) {}
}

// ==================== ROUTING ====================
function setImages() {
  els.mainBgImg.src   = IMAGES.MAIN_BG;
  els.coolBgImg.src   = IMAGES.PINK_BG;
  els.tabImgDK.src    = IMAGES.TAB_DK;
  els.tabImgYK.src    = IMAGES.TAB_YK;
  els.tabImgFK.src    = IMAGES.TAB_FK;
  els.folderFront.src = IMAGES.FOLDER;
  els.successImg.src  = IMAGES.CORRECT;
}

function showScreen(view) {
  // Hide all
  Object.values(screens).forEach(s => s.classList.remove('active'));

  const isTab = !!TABS[view];

  if (isTab) {
    screens.tab.classList.add('active');
    screens.tab.style.background = TABS[view].color;
    els.tabLabel.textContent  = view;
    els.tabLabel2.textContent = view;
    els.tabInner.classList.toggle('animating', state.animating);
  } else if (screens[view]) {
    screens[view].classList.add('active');
    if (view === 'main')     els.mainInner.classList.toggle('animating', state.animating);
    if (view === 'cool')     els.coolInner.classList.toggle('animating', state.animating);
    if (view === 'password') els.pwInner.classList.toggle('animating', state.animating);
  }
}

let animTimer = null;
function go(view) {
  window.scrollTo(0, 0);
  state.view      = view;
  state.animating = true;
  showScreen(view);
  clearTimeout(animTimer);
  animTimer = setTimeout(() => {
    state.animating = false;
    // Remove animating class after it plays
    [els.mainInner, els.coolInner, els.pwInner, els.tabInner].forEach(el => {
      if (el) el.classList.remove('animating');
    });
  }, 650);
}

// ==================== PASSWORD LOGIC ====================
function isCooldown() {
  return state.cooldownUntil && Date.now() < state.cooldownUntil;
}

function updatePwImage() {
  if (isCooldown()) {
    els.pwBgImg.src = IMAGES.COOLDOWN;
  } else if (state.attempts === 0) {
    els.pwBgImg.src = IMAGES.PW_BG;
  } else if (state.attempts === 1) {
    els.pwBgImg.src = IMAGES.WRONG;
  } else {
    els.pwBgImg.src = IMAGES.BROS;
  }
}

function updateCooldownText() {
  if (!isCooldown()) {
    els.cooldownText.style.display = 'none';
    els.pwInput.disabled = false;
    return;
  }
  els.pwInput.disabled = true;
  els.cooldownText.style.display = 'block';
  const ms = state.cooldownUntil - Date.now();
  const s  = Math.ceil(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  els.cooldownText.textContent = `${mm}:${ss} LEFT`;
}

let cooldownInterval = null;
function startCooldownTick() {
  clearInterval(cooldownInterval);
  cooldownInterval = setInterval(() => {
    if (!state.cooldownUntil || Date.now() >= state.cooldownUntil) {
      clearInterval(cooldownInterval);
      state.cooldownUntil = 0;
    }
    updateCooldownText();
    updatePwImage();
  }, 1000);
}

async function verifyPassword(pw) {
  if (SUPABASE.url) {
    try {
      const r = await fetch(`${SUPABASE.url}/functions/v1/${SUPABASE.fnName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE.anonKey}`,
        },
        body: JSON.stringify({ password: pw }),
      });
      const j = await r.json();
      return !!j.correct;
    } catch (_) { return false; }
  }
  return pw.trim().toLowerCase() === DEMO_PASSWORD.toLowerCase();
}

async function submitPassword() {
  if (isCooldown()) return;
  const pw = els.pwInput.value;
  if (!pw) return;

  const ok = await verifyPassword(pw);

  if (ok) {
    onCorrect();
    return;
  }

  const a = state.attempts + 1;
  if (a >= MAX_ATTEMPTS) {
    const until = Date.now() + COOLDOWN_MINUTES * 60_000;
    state.attempts      = a;
    state.cooldownUntil = until;
    persist(a, until);
    startCooldownTick();
  } else {
    state.attempts = a;
    persist(a, 0);
  }

  els.pwInput.value = '';
  state.pwValue     = '';
  updatePwImage();
  updateCooldownText();

  // Shake animation
  els.pwInput.classList.remove('shake');
  void els.pwInput.offsetWidth; // reflow
  els.pwInput.classList.add('shake');
  setTimeout(() => els.pwInput.classList.remove('shake'), 480);
}

// ==================== SUCCESS SEQUENCE ====================
function onCorrect() {
  persist(0, 0);
  state.attempts      = 0;
  state.cooldownUntil = 0;
  els.pwInput.value   = '';

  // Show success overlay
  els.successOverlay.style.display = 'flex';

  // Phase 2: bubbles
  setTimeout(() => {
    spawnBubbles();
  }, 1700);

  // Phase 3: transition to cool
  setTimeout(() => {
    window.scrollTo(0, 0);
    els.successOverlay.style.display = 'none';
    clearBubbles();
    go('cool');
  }, 4200);
}

// ==================== BUBBLE LAYER ====================
function spawnBubbles() {
  clearBubbles();
  els.bubbleLayer.style.display = 'block';
  bubbles.forEach((b) => {
    const div = document.createElement('div');
    div.className = 'bubble';
    div.style.left   = b.left + '%';
    div.style.width  = b.size + 'px';
    div.style.height = b.size + 'px';
    div.style.animation = `bubbleUp ${b.dur}s ease-in ${b.delay}s forwards`;
    els.bubbleLayer.appendChild(div);
  });
}

function clearBubbles() {
  els.bubbleLayer.innerHTML = '';
  els.bubbleLayer.style.display = 'none';
}

// ==================== VIDEO MODAL ====================
function openVideo() {
  state.videoOpen = true;
  els.videoIframe.src = 'https://www.youtube.com/embed/69n2FpmO5RU?autoplay=1&rel=0';
  els.videoModal.style.display = 'flex';
}

function closeVideo() {
  state.videoOpen = false;
  els.videoIframe.src = '';
  els.videoModal.style.display = 'none';
}

// ==================== TAB HOVER ====================
function setTabHover(name) {
  [
    { el: els.tabImgDK, key: 'DK' },
    { el: els.tabImgYK, key: 'YK' },
    { el: els.tabImgFK, key: 'FK' },
  ].forEach(({ el, key }) => {
    if (name === key) {
      el.classList.add('hovered');
    } else {
      el.classList.remove('hovered');
    }
  });
}

// ==================== EVENT WIRING ====================
function wire() {
  setImages();

  // Main screen
  $('btn-incognito').addEventListener('click', () => go('password'));
  $('btn-tab-dk').addEventListener('click',       () => go('DK'));
  $('btn-tab-yk').addEventListener('click',       () => go('YK'));
  $('btn-tab-fk').addEventListener('click',       () => go('FK'));
  $('btn-tab-dk').addEventListener('mouseenter',  () => setTabHover('DK'));
  $('btn-tab-yk').addEventListener('mouseenter',  () => setTabHover('YK'));
  $('btn-tab-fk').addEventListener('mouseenter',  () => setTabHover('FK'));
  $('btn-tab-dk').addEventListener('mouseleave',  () => setTabHover(null));
  $('btn-tab-yk').addEventListener('mouseleave',  () => setTabHover(null));
  $('btn-tab-fk').addEventListener('mouseleave',  () => setTabHover(null));

  // Cool screen
  $('btn-return-bro').addEventListener('click',   () => go('main'));
  $('btn-cool-mq').addEventListener('click',      () => go('MQ'));
  $('btn-cool-si').addEventListener('click',      () => go('SI'));
  $('btn-who-is').addEventListener('click',       () => openVideo());
  // "lost babygurl? yes" link is a plain <a> in the HTML

  // Password screen
  $('btn-back-pw').addEventListener('click',      () => go('main'));
  els.pwInput.addEventListener('input',  (e) => { state.pwValue = e.target.value; });
  els.pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPassword(); });

  // Tab placeholder screen
  $('btn-back-tab').addEventListener('click', () => {
    const origin = TABS[state.view]?.origin ?? 'main';
    go(origin);
  });

  // Video modal
  $('btn-modal-close').addEventListener('click',  () => closeVideo());
  els.videoModal.addEventListener('click', (e) => {
    if (e.target === els.videoModal) closeVideo();
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.videoOpen) closeVideo();
      else if (state.view === 'password') go('main');
    }
  });

  // Restore cooldown tick if already locked out
  if (isCooldown()) {
    startCooldownTick();
    updateCooldownText();
    updatePwImage();
  }
}

// ==================== BOOT ====================
document.addEventListener('DOMContentLoaded', () => {
  wire();
  showScreen('main');
});
