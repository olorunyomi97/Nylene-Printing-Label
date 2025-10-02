// Entry point: loads screen fragments and initializes step modules
import { state, screens, showScreen } from './state.js';
import { initSourceStep } from './steps/source.js';
import { initProductsStep } from './steps/products.js';
import { initWeightsStep } from './steps/weights.js';
import { initPreviewStep } from './steps/preview.js';
import { initLabelDatabaseStep } from './steps/labeldatabase.js';

async function loadFragment(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return await res.text();
}

async function bootstrap() {
    const app = document.getElementById('app');
    const [src, prod, wts, prv, ldb] = await Promise.all([
        loadFragment('/screens/source.html'),
        loadFragment('/screens/products.html'),
        loadFragment('/screens/weights.html'),
        loadFragment('/screens/preview.html'),
        loadFragment('/screens/labeldatabase.html'),
    ]);
    app.innerHTML = `${src}${prod}${wts}${prv}${ldb}`;

    // Reconnect screen references after HTML injection
    screens.source = document.getElementById('screen-source');
    screens.products = document.getElementById('screen-products');
    screens.weights = document.getElementById('screen-weights');
    screens.preview = document.getElementById('screen-preview');
    screens.labeldb = document.getElementById('screen-labeldb');

    // Initialize steps
    initSourceStep();
    initProductsStep();
    initWeightsStep();
    initPreviewStep();
    initLabelDatabaseStep();

    showScreen('source');
}

bootstrap();

