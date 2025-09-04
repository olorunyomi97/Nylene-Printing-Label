import { state, showScreen } from '../state.js';

export function initSourceStep() {
    document.querySelectorAll('.btn-col[data-group] .option').forEach((btn) => {
        btn.addEventListener('click', () => {
            const group = btn.parentElement.getAttribute('data-group');
            btn.parentElement.querySelectorAll('.option').forEach((x) => x.classList.remove('selected'));
            btn.classList.add('selected');
            state.source[group] = btn.dataset.value;
            state.activeGroup = group;
            state.selectedProduct = null;
            showScreen('products');
            document.dispatchEvent(new CustomEvent('renderProductList'));
        });
    });

    document.querySelectorAll('[data-special]').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-special]').forEach((x) => x.classList.remove('selected'));
            btn.classList.add('selected');
            state.source.special = btn.getAttribute('data-special');
        });
    });

    const next = document.getElementById('btnNextFromSource');
    if (next) next.addEventListener('click', () => {
        const chosenGroup = state.activeGroup || ['silo', 'dryer', 'compound'].find((g) => state.source[g]);
        if (!chosenGroup || !state.source[chosenGroup]) {
            alert('Please choose a source before continuing.');
            return;
        }
        state.activeGroup = chosenGroup;
        state.selectedProduct = null;
        showScreen('products');
        document.dispatchEvent(new CustomEvent('renderProductList'));
    });
}

