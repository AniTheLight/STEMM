// ── MODAL HELPERS (used on bro + sisters pages) ──
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.querySelectorAll('.modal-confirm').forEach(el => el.style.display = 'none');
  document.querySelectorAll('textarea').forEach(el => el.value = '');
}
function submitModal(modalId, textareaId, confirmId) {
  const txt = document.getElementById(textareaId).value.trim();
  if (!txt) return;
  document.getElementById(textareaId).value = '';
  document.getElementById(confirmId).style.display = 'block';
  setTimeout(() => closeModal(modalId), 1800);
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('open');
    });
  });
});

// ── PASSWORD PAGE LOGIC (only runs on password.html) ──
const CORRECT_PASSWORD = 'stemm2024'; // <- change this!
let attempts = 0;
let blocked = false;
let cooldownInterval = null;

function checkPassword() {
  if (blocked) return;
  const input = document.getElementById('pw-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  if (val.toLowerCase() === CORRECT_PASSWORD.toLowerCase()) {
    showSuccess();
  } else {
    attempts++;
    handleWrongAttempt();
  }
}

function handleWrongAttempt() {
  const input = document.getElementById('pw-input');
  if (input) input.value = '';

  if (attempts === 1) {
    showMeme('https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif', 'Wrong answer');
    setStatus('TRY AGAIN');

  } else if (attempts === 2) {
    hideMeme();
    showCharacter('right', 'https://media.giphy.com/media/26FLdaDQ5f7xLs5io/giphy.gif');
    setStatus('GO TO THE BROS SIDE!');
    setTimeout(() => setStatus('GO TO THE BROS SIDE!<br>LA$T TRY', true), 800);

  } else if (attempts >= 3) {
    hideMeme();
    showCharacter('left', 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif');
    if (input) input.disabled = true;
    setStatus('BLOCKED! GO AWAY');
    startCooldown(5 * 60);
    blocked = true;
  }
}

function setStatus(text, isHTML = false) {
  const el = document.getElementById('pw-status-text');
  if (!el) return;
  if (isHTML) el.innerHTML = text;
  else el.textContent = text;
}

function showMeme(src, label) {
  const meme = document.getElementById('pw-meme');
  if (!meme) return;
  document.getElementById('pw-meme-img').src = src;
  document.getElementById('pw-meme-label').textContent = label;
  meme.style.display = 'block';
}
function hideMeme() {
  const meme = document.getElementById('pw-meme');
  if (meme) meme.style.display = 'none';
}
function showCharacter(side, src) {
  const el = document.getElementById('pw-char-' + side);
  if (!el) return;
  el.src = src;
  el.style.display = 'block';
  el.style.setProperty('--dir', side === 'left' ? '-60px' : '60px');
}

function startCooldown(seconds) {
  const timerEl = document.getElementById('cooldown-timer');
  if (!timerEl) return;
  timerEl.style.display = 'block';
  let remaining = seconds;
  function tick() {
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    timerEl.textContent = '(' + m + ':' + s + ' COOLDOWN)';
    if (remaining <= 0) {
      clearInterval(cooldownInterval);
      blocked = false; attempts = 0;
      timerEl.style.display = 'none';
      const inp = document.getElementById('pw-input');
      if (inp) inp.disabled = false;
      const charLeft = document.getElementById('pw-char-left');
      if (charLeft) charLeft.style.display = 'none';
      setStatus('TRY AGAIN');
    }
    remaining--;
  }
  tick();
  cooldownInterval = setInterval(tick, 1000);
}

function showSuccess() {
  hideMeme();
  ['pw-char-left', 'pw-char-right'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const bubble = document.getElementById('pw-bubble');
  if (bubble) {
    bubble.classList.add('correct');
    bubble.innerHTML = '<span class="pw-success-text">Correct!</span>';
  }
  setStatus('WELCOME TO THE COOL $IDE');
  showCharacter('right', 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif');
  setTimeout(() => { window.location.href = 'sisters.html'; }, 2200);
}

// ── GIF MODAL (sisters page) ──
function openGifModal() { openModal('gif-modal'); }
