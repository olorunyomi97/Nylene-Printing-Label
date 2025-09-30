// Central state and shared screen helpers
import { generateUnitNumber, generateBigCode } from './utils/generators.js';

export const state = {
    source: { silo: null, dryer: null, compound: null, special: null },
    activeGroup: null,
    selectedProduct: null,
    weights: { netLb: 0, grossLb: 0, tareLb: 0 },
    unitNumber: generateUnitNumber(null, null),
    bigCode: generateBigCode(),
    excelHandle: null,
    // Last successfully printed label snapshot for reprint
    lastPrinted: null,
    // Optional override for preview timestamp (used during reprint)
    previewTimestamp: null,
    // Whether the next click should reprint the last label
    reprintAvailable: false,
};

export const screens = {
    source: null,
    products: null,
    weights: null,
    preview: null,
    labeldb: null,
};

export function showScreen(name) {
    Object.values(screens).forEach((s) => s && s.classList.remove('active'));
    const el = screens[name];
    if (el) el.classList.add('active');
}

