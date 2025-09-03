import { state, showScreen } from '../state.js';
import { parseNumber } from '../utils/format.js';

export function initWeightsStep() {
    const inputNet = document.getElementById('netWeight');
    const inputGross = document.getElementById('grossWeight');
    const inputTare = document.getElementById('tareWeight');
    let focusedInput = inputNet;

    function syncWeightsFromInputs() {
        state.weights.netLb = parseNumber(inputNet.value);
        state.weights.grossLb = parseNumber(inputGross.value);
        state.weights.tareLb = parseNumber(inputTare.value);
    }

    function prefillDefaultWeights() {
        if (inputNet) inputNet.value = '1800';
        if (inputTare) inputTare.value = '81';
        if (inputGross) inputGross.value = '';
        syncWeightsFromInputs();
    }

    document.addEventListener('prefillDefaultWeights', prefillDefaultWeights);

    [inputNet, inputGross, inputTare].forEach((inp) => {
        inp.addEventListener('focus', () => {
            focusedInput = inp;
        });
        inp.addEventListener('input', syncWeightsFromInputs);
    });

    const clearBtn = document.getElementById('clearWeights');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        inputNet.value = '';
        inputGross.value = '';
        inputTare.value = '';
        syncWeightsFromInputs();
    });

    document.querySelectorAll('.keys button').forEach((key) => {
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

    const back = document.getElementById('backToProducts');
    if (back) back.addEventListener('click', () => showScreen('products'));

    const preview = document.getElementById('previewBtn');
    if (preview) preview.addEventListener('click', () => {
        syncWeightsFromInputs();
        document.dispatchEvent(new CustomEvent('updatePreview'));
        showScreen('preview');
    });
}

