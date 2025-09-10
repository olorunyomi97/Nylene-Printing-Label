import { state, showScreen } from "../state.js";

export function initScanStep() {
    const back = document.getElementById("backFromScan");
    if (back) back.addEventListener("click", () => showScreen("source"));
    updateScanDetails();
    document.addEventListener("updateScanDetails", updateScanDetails);
}

function updateScanDetails() {
    const data = state.lastScan || {};
    const parsed = data.parsed || null;
    const info = data.info || null;

    const unitEl = document.getElementById("scanUnit");
    const prodEl = document.getElementById("scanProduct");
    const srcEl = document.getElementById("scanSource");
    const netEl = document.getElementById("scanNet");
    const tareEl = document.getElementById("scanTare");
    const grossEl = document.getElementById("scanGross");
    const rawEl = document.getElementById("scanRaw");

    const sourceText = (() => {
        if (!parsed && !info) return "—";
        const group = info && info.sourceGroup ? String(info.sourceGroup).toUpperCase() : (parsed && parsed.src ? String(parsed.src).toUpperCase() : "");
        const letter = info && info.sourceLetter ? info.sourceLetter : "";
        return group || letter ? `${group}${letter ? '-' + letter : ''}` : "—";
    })();

    if (unitEl) unitEl.textContent = (parsed && parsed.unitNumber) ? parsed.unitNumber : "—";
    if (prodEl) prodEl.textContent = (parsed && parsed.product) ? parsed.product : "—";
    if (srcEl) srcEl.textContent = sourceText;
    if (netEl) netEl.textContent = (parsed && typeof parsed.net === "number") ? parsed.net.toFixed(1) : "—";
    if (tareEl) tareEl.textContent = (parsed && typeof parsed.tare === "number") ? parsed.tare.toFixed(1) : "—";
    if (grossEl) grossEl.textContent = (parsed && typeof parsed.gross === "number") ? parsed.gross.toFixed(1) : "—";
    if (rawEl) rawEl.textContent = data.raw || "—";
}

