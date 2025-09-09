import { state, showScreen } from "../state.js";
import { lbToKg } from "../utils/format.js";
import { drawBarcode } from "../barcode.js";
import { buildBarcodePayload } from "../payload.js";
import { appendLogRecord, bindExcelButton } from "../logs.js";
import { showScreen } from "../state.js";
import { appendHistoryRecord } from "../history.js";

export function initPreviewStep() {
    document.addEventListener("updatePreview", updatePreview);
    updatePreview();

    const back = document.getElementById("backToWeights");
    if (back) back.addEventListener("click", () => showScreen("weights"));

    const clear = document.getElementById("clearPreview");
    if (clear)
        clear.addEventListener("click", () => {
            state.unitNumber = state.unitNumber; // keep same by default/
            updatePreview();
        });

    const printBtn = document.getElementById("printBtn");
    if (printBtn)
        printBtn.addEventListener("click", () => {
            updatePreview();
            const handleAfterPrint = async () => {
                try {
                    await appendLogRecord();
                    appendHistoryRecord();
                } catch (err) {
                    console.error("Log append failed after print", err);
                    alert("Saving log failed after printing.");
                } finally {
                    window.removeEventListener("afterprint", handleAfterPrint);
                }
            };
            window.addEventListener("afterprint", handleAfterPrint, { once: true });
            window.print();
        });

    const openDbBtn = document.getElementById("openLabelDb");
    if (openDbBtn)
        openDbBtn.addEventListener("click", () => {
            showScreen("labeldb");
        });

    bindExcelButton();
}

function updatePreview() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${pad(now.getMonth() + 1)}/${pad(
        now.getDate()
    )}/${now.getFullYear()} ${pad(now.getHours())}:${pad(
        now.getMinutes()
    )}:${pad(now.getSeconds())}`;
    const pkgDate = document.getElementById("pkgDate");
    if (pkgDate) pkgDate.textContent = stamp;

    const bigCode = document.getElementById("bigCode");
    if (bigCode) bigCode.textContent = state.unitNumber;

    const grossLb = state.weights.grossLb;
    const netLb = state.weights.netLb;
    const tareLb = state.weights.tareLb;
    const grossKgEl = document.getElementById("grossKg");
    const grossLbEl = document.getElementById("grossLb");
    const netKgEl = document.getElementById("netKg");
    const netLbEl = document.getElementById("netLb");
    const tareKgEl = document.getElementById("tareKg");
    const tareLbEl = document.getElementById("tareLb");
    if (grossKgEl) grossKgEl.textContent = lbToKg(grossLb).toFixed(1);
    if (grossLbEl) grossLbEl.textContent = grossLb.toFixed(1);
    if (netKgEl) netKgEl.textContent = lbToKg(netLb).toFixed(1);
    if (netLbEl) netLbEl.textContent = netLb.toFixed(1);
    if (tareKgEl) tareKgEl.textContent = lbToKg(tareLb).toFixed(1);
    if (tareLbEl) tareLbEl.textContent = tareLb.toFixed(1);

    const unit = document.getElementById("unitNumber");
    if (unit) unit.textContent = state.bigCode;

    const canvas = document.getElementById("barcodeCanvas");
    if (canvas) drawBarcode(canvas, buildBarcodePayload());

    const productEl = document.getElementById("productName");
    const sourceEl = document.getElementById("sourceChosen");
    if (productEl) productEl.textContent = state.bigCode || "—";
    if (sourceEl) {
        const group = state.activeGroup;
        const letter = group ? state.source[group] : null;
        const special = state.source.special
            ? ` (${state.source.special})`
            : "";
        sourceEl.textContent =
            group && letter
                ? `${group.toUpperCase()} ${letter}${special}`
                : "—";
    }
}
