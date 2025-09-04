import { state } from './state.js';

export function buildBarcodePayload() {
    const allowed = /[^A-Z0-9\-\. \$\/\+\%]/g;
    const sanitizeCode39 = (s) => (s || '').toString().toUpperCase().replace(allowed, '');
    const group = state.activeGroup || '';
    const letter = group ? state.source[group] || '' : '';
    const src = group && letter ? `${group.toUpperCase()}-${letter}` : 'NA';
    const sp = state.source.special ? ` SP ${sanitizeCode39(state.source.special)}` : '';
    const product = sanitizeCode39(state.bigCode || 'NA');
    const net = Number(state.weights.netLb || 0).toFixed(1);
    const gro = Number(state.weights.grossLb || 0).toFixed(1);
    const tar = Number(state.weights.tareLb || 0).toFixed(1);
    const unit = sanitizeCode39(state.unitNumber);
    return `UN ${unit} PR ${product} SRC ${sanitizeCode39(src)}${sp} NET ${net} TAR ${tar} GRO ${gro}`.trim();
}

