// Central state and shared screen helpers
import { generateUnitNumber, generateBigCode } from './utils/generators.js';

export const state = {
    source: { silo: null, dryer: null, compound: null, special: null },
    activeGroup: null,
    selectedProduct: null,
    weights: { netLb: 0, grossLb: 0, tareLb: 0 },
    unitNumber: generateUnitNumber(),
    bigCode: generateBigCode(),
    excelHandle: null,
};

export const screens = {
    source: null,
    products: null,
    weights: null,
    preview: null,
};

export function showScreen(name) {
    Object.values(screens).forEach((s) => s && s.classList.remove('active'));
    const el = screens[name];
    if (el) el.classList.add('active');
}

