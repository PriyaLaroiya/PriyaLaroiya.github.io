// ─── Helpers ────────────────────────────────────────────────────────
function reveal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('visible');
}

function showStep(stepId) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  const step = document.getElementById(stepId);
  if (step) step.classList.add('active');
}

// ─── Unified Progress ───────────────────────────────────────────────
// Single progress value that ONLY moves forward
const progressFill = document.getElementById('progress-fill');
let globalProgress = 0;

function setProgress(target, duration) {
  // Animate from current to target over duration ms
  if (target <= globalProgress) return; // never go backwards
  const start = globalProgress;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
    globalProgress = start + (target - start) * eased;

    // Update both progress bars
    progressFill.style.width = globalProgress + '%';
    const statusFill = document.getElementById('status-progress-fill');
    if (statusFill) statusFill.style.width = globalProgress + '%';

    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ─── Typewriter (Phase 1) ───────────────────────────────────────────
const phrases = [
  'Reading your policy documents.',
  'Comparing 340+ available options.',
  'Checking for deductible mismatches.',
  'Calculating your potential savings.',
];
const typedEl = document.getElementById('typed-text');
let phraseIndex = 0;
let typewriterActive = true;

function typePhrase(el, text, cb) {
  let i = 0;
  const iv = setInterval(() => {
    if (!typewriterActive) { clearInterval(iv); return; }
    el.textContent = text.slice(0, i + 1);
    i++;
    if (i >= text.length) { clearInterval(iv); cb(); }
  }, 45);
}

function deletePhrase(el, cb) {
  let t = el.textContent, i = t.length;
  const iv = setInterval(() => {
    if (!typewriterActive) { clearInterval(iv); return; }
    i--;
    el.textContent = t.slice(0, i);
    if (i <= 0) { clearInterval(iv); cb(); }
  }, 30);
}

function runTypewriter(el) {
  if (!typewriterActive) return;
  typePhrase(el, phrases[phraseIndex], () => {
    setTimeout(() => {
      if (!typewriterActive) return;
      deletePhrase(el, () => {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(() => runTypewriter(el), 400);
      });
    }, 2200);
  });
}

// ─── Phase 1 → Phase 2 ─────────────────────────────────────────────
function enterPhase2() {
  typewriterActive = false;

  // Fade out phase 1 content
  document.querySelector('.screen-content').classList.add('faded');

  setTimeout(() => {
    document.getElementById('phase-2').classList.add('active');

    // Status bar progress starts at current globalProgress (10%)
    const statusFill = document.getElementById('status-progress-fill');
    statusFill.style.width = globalProgress + '%';

    setTimeout(() => reveal('reveal-status'), 200);

    // Show announcement
    setTimeout(() => {
      showStep('step-announcement');
      setTimeout(() => reveal('reveal-announcement'), 300);
      setTimeout(() => {
        reveal('reveal-countdown');
        // Move progress to 20% during countdown
        setProgress(20, 3000);
        startCountdown();
      }, 800);
    }, 600);
  }, 900);
}

// ─── Countdown → Q1 ────────────────────────────────────────────────
function startCountdown() {
  const numEl = document.getElementById('countdown-num');
  let count = 3;
  const iv = setInterval(() => {
    count--;
    numEl.textContent = count;
    if (count <= 0) {
      clearInterval(iv);
      setTimeout(() => goToQuestion(1), 400);
    }
  }, 1000);
}

// ─── Question navigation ────────────────────────────────────────────
function goToQuestion(n) {
  showStep('step-q' + n);
  setTimeout(() => reveal('reveal-q' + n + '-counter'), 200);
  setTimeout(() => reveal('reveal-q' + n + '-title'), 400);
  setTimeout(() => reveal('reveal-q' + n + '-micro'), 600);
  setTimeout(() => reveal('reveal-q' + n + '-options'), 800);
}

// ─── Back button handler ────────────────────────────────────────────
document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('q-back')) return;
  const backTo = parseInt(e.target.dataset.back);
  if (backTo === 0) {
    // Back to announcement
    showStep('step-announcement');
    reveal('reveal-announcement');
    reveal('reveal-countdown');
  } else {
    currentQ = backTo - 1;
    goToQuestion(backTo);
  }
});

// ─── Option click handler ───────────────────────────────────────────
let currentQ = 0;

document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('pill-btn')) return;

  const qNum = parseInt(e.target.dataset.q);

  // Select this option
  document.querySelectorAll(`.pill-btn[data-q="${qNum}"]`).forEach(b => b.classList.remove('selected'));
  e.target.classList.add('selected');

  if (qNum <= currentQ) return;
  currentQ = qNum;

  setTimeout(() => {
    if (qNum === 1) {
      setProgress(35, 800); // 20 → 35
      goToQuestion(2);
    } else if (qNum === 2) {
      setProgress(50, 800); // 35 → 50
      goToQuestion(3);
    } else if (qNum === 3) {
      setProgress(65, 800); // 50 → 65
      showCompletingStep();
    }
  }, 700);
});

// ─── Completing analysis → Results ──────────────────────────────────
function showCompletingStep() {
  showStep('step-completing');

  setTimeout(() => reveal('reveal-completing'), 300);
  setTimeout(() => reveal('reveal-completing-sub'), 800);

  // Fill to 100% over 3.5s
  setTimeout(() => setProgress(100, 3500), 500);

  // Then show results
  setTimeout(showResults, 4500);
}

function showResults() {
  document.getElementById('phase-2').classList.remove('active');

  setTimeout(() => {
    document.getElementById('phase-3').classList.add('active');

    setTimeout(() => reveal('reveal-eyebrow'), 300);
    setTimeout(() => reveal('reveal-results-headline'), 700);
    setTimeout(() => {
      reveal('reveal-table');
      reveal('reveal-cta');
      // Position savings band on the gold row
      requestAnimationFrame(() => {
        const goldRow = document.querySelector('.col-row-gold');
        const colCards = document.querySelector('.col-cards');
        if (goldRow && colCards) {
          const band = document.querySelector('.savings-band');
          const rowRect = goldRow.getBoundingClientRect();
          const cardsRect = colCards.getBoundingClientRect();
          band.style.top = (rowRect.top - cardsRect.top) + 'px';
          band.style.height = rowRect.height + 'px';
        }
      });
    }, 1200);
  }, 800);
}

// ─── Keyboard shortcuts for testing ──────────────────────────────────
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key < '1' || key > '7') return;

  // Stop all timers
  typewriterActive = false;

  // Reset all phases
  document.querySelector('.screen-content').classList.remove('faded');
  document.getElementById('phase-2').classList.remove('active');
  document.getElementById('phase-3').classList.remove('active');

  // Make all reveals visible instantly
  const forceReveal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('visible');
  };

  switch (key) {
    case '1': // Phase 1 — loading
      document.querySelector('.screen-content').classList.remove('faded');
      forceReveal('reveal-headline');
      forceReveal('reveal-card');
      forceReveal('reveal-progress');
      progressFill.style.width = '10%';
      typewriterActive = true;
      typedEl.textContent = 'Reading your policy documents.';
      break;

    case '2': // Announcement
      document.querySelector('.screen-content').classList.add('faded');
      document.getElementById('phase-2').classList.add('active');
      forceReveal('reveal-status');
      showStep('step-announcement');
      forceReveal('reveal-announcement');
      forceReveal('reveal-countdown');
      document.getElementById('status-progress-fill').style.width = '15%';
      break;

    case '3': // Q1
      document.querySelector('.screen-content').classList.add('faded');
      document.getElementById('phase-2').classList.add('active');
      forceReveal('reveal-status');
      document.getElementById('status-progress-fill').style.width = '20%';
      goToQuestionInstant(1);
      break;

    case '4': // Q2
      document.querySelector('.screen-content').classList.add('faded');
      document.getElementById('phase-2').classList.add('active');
      forceReveal('reveal-status');
      document.getElementById('status-progress-fill').style.width = '35%';
      goToQuestionInstant(2);
      break;

    case '5': // Q3
      document.querySelector('.screen-content').classList.add('faded');
      document.getElementById('phase-2').classList.add('active');
      forceReveal('reveal-status');
      document.getElementById('status-progress-fill').style.width = '50%';
      goToQuestionInstant(3);
      break;

    case '6': // Completing
      document.querySelector('.screen-content').classList.add('faded');
      document.getElementById('phase-2').classList.add('active');
      forceReveal('reveal-status');
      document.getElementById('status-progress-fill').style.width = '85%';
      showStep('step-completing');
      forceReveal('reveal-completing');
      forceReveal('reveal-completing-sub');
      break;

    case '7': // Results
      document.querySelector('.screen-content').classList.add('faded');
      document.getElementById('phase-3').classList.add('active');
      forceReveal('reveal-eyebrow');
      forceReveal('reveal-results-headline');
      forceReveal('reveal-table');
      forceReveal('reveal-cta');
      // Position savings band
      requestAnimationFrame(() => {
        const goldRow = document.querySelector('.col-row-gold');
        const colCards = document.querySelector('.col-cards');
        if (goldRow && colCards) {
          const band = document.querySelector('.savings-band');
          const rowRect = goldRow.getBoundingClientRect();
          const cardsRect = colCards.getBoundingClientRect();
          band.style.top = (rowRect.top - cardsRect.top) + 'px';
          band.style.height = rowRect.height + 'px';
        }
      });
      break;
  }
});

function goToQuestionInstant(n) {
  showStep('step-q' + n);
  ['counter', 'title', 'micro', 'options'].forEach(part => {
    const el = document.getElementById('reveal-q' + n + '-' + part);
    if (el) el.classList.add('visible');
  });
}

// ─── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => reveal('reveal-headline'), 300);
  setTimeout(() => reveal('reveal-card'), 1100);
  setTimeout(() => { typewriterActive = true; runTypewriter(typedEl); }, 1600);
  setTimeout(() => reveal('reveal-progress'), 2000);

  // Start progress — animate to 10% over ~7.5s, then transition
  setTimeout(() => {
    setProgress(10, 7500);
    setTimeout(enterPhase2, 8000);
  }, 2500);
});
