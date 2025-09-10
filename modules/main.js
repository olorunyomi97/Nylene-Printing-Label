// Entry point: loads screen fragments and initializes step modules
import { state, screens, showScreen } from './state.js';
import { initSourceStep } from './steps/source.js';
import { initProductsStep } from './steps/products.js';
import { initWeightsStep } from './steps/weights.js';
import { initPreviewStep } from './steps/preview.js';
import { initScanStep } from './steps/scan.js';
import { initLabelDatabaseStep } from './steps/labeldatabase.js';
import { initScanner } from './scanner.js';

async function loadFragment(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return await res.text();
}

async function bootstrap() {
    const app = document.getElementById('app');
    const [src, prod, wts, prv, ldb, scn] = await Promise.all([
        loadFragment('/screens/source.html'),
        loadFragment('/screens/products.html'),
        loadFragment('/screens/weights.html'),
        loadFragment('/screens/preview.html'),
        loadFragment('/screens/labeldatabase.html'),
        loadFragment('/screens/scan.html'),
    ]);
    app.innerHTML = `${src}${prod}${wts}${prv}${ldb}${scn}`;

    // Reconnect screen references after HTML injection
    screens.source = document.getElementById('screen-source');
    screens.products = document.getElementById('screen-products');
    screens.weights = document.getElementById('screen-weights');
    screens.preview = document.getElementById('screen-preview');
    screens.labeldb = document.getElementById('screen-labeldb');
    screens.scan = document.getElementById('screen-scan');

    // Initialize steps
    initSourceStep();
    initProductsStep();
    initWeightsStep();
    initPreviewStep();
    initLabelDatabaseStep();
    initScanStep();

    // Initialize scanner: store details and navigate to the scan screen
    initScanner(({ raw, parsed, info, error }) => {
        state.lastScan = { raw, parsed, info, error };
        const ev = new Event('updateScanDetails');
        document.dispatchEvent(ev);
        showScreen('scan');
    });

    showScreen('source');
}

bootstrap();

function showToast(title, subtitle) {
    let host = document.getElementById('toast-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'toast-host';
        document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div class="toast-title">${escapeHtml(title)}</div>${subtitle ? `<div class="toast-sub">${escapeHtml(subtitle)}</div>` : ''}`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

