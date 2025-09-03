import { state, showScreen } from '../state.js';

const PRODUCTS = {
    silo: { A: ['BS700D', 'BS700A'], B: ['BS700D'], C: ['BS700R80', 'BS700RA', 'BS700D', 'BS640T'], D: ['BS700D'] },
    dryer: { A: ['700D-INT', 'BS640T'], B: ['BS700D', 'BS640T'], C: ['BS700D', 'BS640T', 'BS640UX'], D: ['BS640AFOIL'] },
    compound: { A: ['BX3WQ662X'], B: ['CSDN-INT', 'BS700D', 'BS640AFOIL', 'BS640UX', 'PA6-205'] },
    extrusion: { EA: [], EB: [] },
    other: { UX: ['BS640UX'], LT: ['CAPRO'] },
};

export function initProductsStep() {
    const back = document.getElementById('backToSource');
    if (back) back.addEventListener('click', () => showScreen('source'));

    const proceed = document.getElementById('btnProceedWeights');
    if (proceed) proceed.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('prefillDefaultWeights'));
        showScreen('weights');
        document.getElementById('grossWeight').focus();
    });

    document.addEventListener('renderProductList', () => render());
    render();

    function render() {
        const group = state.activeGroup;
        const letter = state.source[group];
        const listEl = document.getElementById('productList');
        const metaEl = document.getElementById('productMeta');
        if (!listEl || !metaEl) return;
        if (!group || !letter) {
            listEl.innerHTML = '';
            metaEl.textContent = '';
            return;
        }
        const items = PRODUCTS[group] && PRODUCTS[group][letter] ? PRODUCTS[group][letter] : [];
        metaEl.textContent = `${group.toUpperCase()} ${letter}`;
        listEl.innerHTML = '';
        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'muted-text';
            empty.textContent = 'No products for this source.';
            listEl.appendChild(empty);
        } else {
            items.forEach((prod) => {
                const b = document.createElement('button');
                b.className = 'btn product-btn';
                b.textContent = prod;
                b.addEventListener('click', () => {
                    listEl.querySelectorAll('.btn').forEach((x) => x.classList.remove('selected'));
                    b.classList.add('selected');
                    state.selectedProduct = prod;
                    state.bigCode = prod;
                    if (proceed) proceed.disabled = false;
                    document.dispatchEvent(new CustomEvent('prefillDefaultWeights'));
                    showScreen('weights');
                    document.getElementById('grossWeight').focus();
                });
                if (state.selectedProduct === prod) b.classList.add('selected');
                listEl.appendChild(b);
            });
            if (proceed) proceed.disabled = !state.selectedProduct;
        }
    }
}

