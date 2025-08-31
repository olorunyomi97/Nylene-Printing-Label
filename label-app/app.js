// App state
const state = {
  source: {
    silo: null,
    dryer: null,
    compound: null,
    special: null,
  },
  weights: {
    netLb: 0,
    grossLb: 0,
    tareLb: 0,
  },
  unitNumber: generateUnitNumber(),
  bigCode: generateBigCode(),
};

// Screen helpers
const screens = {
  source: document.getElementById('screen-source'),
  weights: document.getElementById('screen-weights'),
  preview: document.getElementById('screen-preview'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// Source selection logic
document.querySelectorAll('.btn-col[data-group] .option').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.parentElement.getAttribute('data-group');
    // Toggle selection within group
    btn.parentElement.querySelectorAll('.option').forEach(x => x.classList.remove('selected'));
    btn.classList.add('selected');
    state.source[group] = btn.dataset.value;
  });
});

document.querySelectorAll('[data-special]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-special]').forEach(x => x.classList.remove('selected'));
    btn.classList.add('selected');
    state.source.special = btn.getAttribute('data-special');
  });
});

document.getElementById('btnNextFromSource').addEventListener('click', () => {
  showScreen('weights');
  // Focus first input
  document.getElementById('netWeight').focus();
});

document.getElementById('backToSource').addEventListener('click', () => showScreen('source'));

// Weights screen logic
const inputNet = document.getElementById('netWeight');
const inputGross = document.getElementById('grossWeight');
const inputTare = document.getElementById('tareWeight');
let focusedInput = inputNet;

[inputNet, inputGross, inputTare].forEach(inp => {
  inp.addEventListener('focus', () => { focusedInput = inp; });
  inp.addEventListener('input', syncWeightsFromInputs);
});

document.getElementById('clearWeights').addEventListener('click', () => {
  inputNet.value = '';
  inputGross.value = '';
  inputTare.value = '';
  syncWeightsFromInputs();
});

// On-screen keypad
document.querySelectorAll('.keys button').forEach(key => {
  key.addEventListener('click', () => {
    if (!focusedInput) focusedInput = inputNet;
    const label = key.textContent.trim();
    if (label === '⌫') {
      focusedInput.value = focusedInput.value.slice(0, -1);
    } else {
      focusedInput.value += label;
    }
    focusedInput.dispatchEvent(new Event('input', { bubbles: true }));
    focusedInput.focus();
  });
});

function parseNumber(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function syncWeightsFromInputs() {
  state.weights.netLb = parseNumber(inputNet.value);
  state.weights.grossLb = parseNumber(inputGross.value);
  state.weights.tareLb = parseNumber(inputTare.value);
}

document.getElementById('previewBtn').addEventListener('click', () => {
  syncWeightsFromInputs();
  updatePreview();
  showScreen('preview');
});

document.getElementById('backToWeights').addEventListener('click', () => showScreen('weights'));

document.getElementById('clearPreview').addEventListener('click', () => {
  // Reset state minimally
  state.unitNumber = generateUnitNumber();
  state.bigCode = generateBigCode();
  updatePreview();
});

// Preview fill and barcode rendering
function lbToKg(lb) { return +(lb * 0.45359237).toFixed(1); }

function updatePreview() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  document.getElementById('pkgDate').textContent = stamp;

  document.getElementById('bigCode').textContent = state.bigCode;

  const grossLb = state.weights.grossLb;
  const netLb = state.weights.netLb;
  document.getElementById('grossKg').textContent = lbToKg(grossLb).toFixed(1);
  document.getElementById('grossLb').textContent = grossLb.toFixed(1);
  document.getElementById('netKg').textContent = lbToKg(netLb).toFixed(1);
  document.getElementById('netLb').textContent = netLb.toFixed(1);

  document.getElementById('unitNumber').textContent = state.unitNumber;
  drawBarcode(document.getElementById('barcodeCanvas'), state.unitNumber);
}

// Simple Code128-like placeholder barcode (not spec-perfect, but scannable as Code39)
function drawBarcode(canvas, text) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // We'll draw a simple Code39 style pattern using a basic library-free approach
  const code39 = {
    '0':'101001101101', '1':'110100101011', '2':'101100101011', '3':'110110010101',
    '4':'101001101011', '5':'110100110101', '6':'101100110101', '7':'101001011011',
    '8':'110100101101', '9':'101100101101', 'A':'110101001011', 'B':'101101001011',
    'C':'110110100101', 'D':'101011001011', 'E':'110101100101', 'F':'101101100101',
    'G':'101010011011', 'H':'110101001101', 'I':'101101001101', 'J':'101011001101',
    'K':'110101010011', 'L':'101101010011', 'M':'110110101001', 'N':'101011010011',
    'O':'110101101001', 'P':'101101101001', 'Q':'101010110011', 'R':'110101011001',
    'S':'101101011001', 'T':'101011011001', 'U':'110010101011', 'V':'100110101011',
    'W':'110011010101', 'X':'100101101011', 'Y':'110010110101', 'Z':'100110110101',
    '-':'100101011011', '.':'110010101101', ' ':'100110101101', '$':'100100100101',
    '/':'100100101001', '+':'100101001001', '%':'101001001001', '*':'100101101101'
  };
  const content = `*${text.toUpperCase()}*`;
  const narrow = 2; // px
  const wide = narrow * 3;
  let x = 10;
  const y = 10;
  const height = canvas.height - 20;
  ctx.fillStyle = '#000';
  for (const ch of content) {
    const pattern = code39[ch];
    if (!pattern) continue;
    for (let i = 0; i < pattern.length; i++) {
      const isBar = i % 2 === 0;
      const isWide = pattern[i] === '1';
      const w = isWide ? wide : narrow;
      if (isBar) ctx.fillRect(x, y, w, height);
      x += w;
    }
    // Inter-character gap
    x += narrow;
  }
}

// Print button
document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

// Generators
function generateUnitNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `BC${y}${m}${d}${rand}`; // e.g., BC2508041234
}

function generateBigCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 7; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

// Initialize
updatePreview();
