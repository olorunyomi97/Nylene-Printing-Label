import { state, showScreen } from "../state.js";
import {
    generateUnitNumber,
    commitPrintedUnitNumber,
} from "../utils/generators.js";
import { lbToKg } from "../utils/format.js";

import { appendLogRecord, bindExcelButton } from "../logs.js";
import { appendHistoryRecord } from "../history.js";

export function initPreviewStep() {
    document.addEventListener("updatePreview", updatePreview);
    updatePreview();

    // Render barcode with print-optimized settings during print
    const handleBeforePrint = () => {
        renderBarcode(true);
    };
    const handleAfterPrintReRender = () => {
        renderBarcode(false);
        window.removeEventListener("afterprint", handleAfterPrintReRender);
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrintReRender);

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
            // If reprint mode is active, temporarily swap preview to the last printed snapshot
            if (state.reprintAvailable && state.lastPrinted) {
                const previous = {
                    unitNumber: state.unitNumber,
                    bigCode: state.bigCode,
                    weights: { ...state.weights },
                    source: { ...state.source },
                    activeGroup: state.activeGroup,
                    previewTimestamp: state.previewTimestamp,
                };

                // Override state with last printed snapshot for preview/print only
                state.unitNumber = state.lastPrinted.unitNumber;
                state.bigCode = state.lastPrinted.bigCode;
                state.weights = { ...state.lastPrinted.weights };
                state.source = { ...state.lastPrinted.source };
                state.activeGroup = state.lastPrinted.activeGroup;
                state.previewTimestamp = state.lastPrinted.printedAt;
                updatePreview();

                const restoreAfterPrint = () => {
                    state.unitNumber = previous.unitNumber;
                    state.bigCode = previous.bigCode;
                    state.weights = { ...previous.weights };
                    state.source = { ...previous.source };
                    state.activeGroup = previous.activeGroup;
                    state.previewTimestamp = previous.previewTimestamp;
                    // After a reprint completes, return button to normal print mode
                    state.reprintAvailable = false;
                    updatePreview();
                    window.removeEventListener("afterprint", restoreAfterPrint);
                };
                window.addEventListener("afterprint", restoreAfterPrint, {
                    once: true,
                });
                window.print();
                return;
            }

            // Normal first-time print flow
            updatePreview();
            const handleAfterPrint = async () => {
                try {
                    await appendLogRecord();
                    appendHistoryRecord();
                    // Commit the sequence only after print completes
                    const group = state.activeGroup;
                    const letter = group ? state.source[group] : undefined;
                    const committed = commitPrintedUnitNumber(group, letter);
                    // Save snapshot of what was printed for reprint
                    const printedAt = new Date().toISOString();
                    state.lastPrinted = {
                        printedAt,
                        unitNumber: committed,
                        bigCode: state.bigCode,
                        weights: { ...state.weights },
                        source: { ...state.source },
                        activeGroup: state.activeGroup,
                    };
                    state.reprintAvailable = true;
                    // Prepare next displayed number without incrementing storage yet
                    state.unitNumber = generateUnitNumber(group, letter);
                } catch (err) {
                    console.error("Log append failed after print", err);
                    alert("Saving log failed after printing.");
                } finally {
                    window.removeEventListener("afterprint", handleAfterPrint);
                    updatePreview();
                }
            };
            window.addEventListener("afterprint", handleAfterPrint, {
                once: true,
            });
            window.print();
        });

    const openDbBtn = document.getElementById("openLabelDb");
    if (openDbBtn)
        openDbBtn.addEventListener("click", () => {
            showScreen("labeldb");
        });

    bindExcelButton();
}

function buildBarcodePayload() {
    const group = state.activeGroup || "";
    const letter = group ? state.source[group] || "" : "";
    const src = group && letter ? `${group}-${letter}` : group || "";
    const parts = [];
    if (state.unitNumber) parts.push("UN", String(state.unitNumber));
    if (state.bigCode) parts.push("PR", String(state.bigCode));
    if (src) parts.push("SRC", String(src));
    if (state.source.special) parts.push("SP", String(state.source.special));
    if (state.weights.netLb)
        parts.push("NET", String(Number(state.weights.netLb)));
    if (state.weights.tareLb)
        parts.push("TAR", String(Number(state.weights.tareLb)));
    if (state.weights.grossLb)
        parts.push("GRO", String(Number(state.weights.grossLb)));
    return parts.join(" ");
}

// function renderBarcode(forPrint = false) {
//     const el = document.getElementById("labelBarcode");
//     if (!el) return;
//     const payload = buildBarcodePayload();

//     try {
//         if (window.JsBarcode && payload) {
//             // Print vs screen settings
//             const moduleWidth = forPrint ? 2 : 2; // thinner bars (2px is safe for most printers)
//             const barHeight = forPrint ? 80 : 60; // not too tall, avoids oversaturation
//             const quietMargin = forPrint ? 12 : 8;

//             window.JsBarcode(el, payload, {
//                 format: "CODE128",
//                 width: moduleWidth,
//                 height: 300,
//                 displayValue: false,
//                 margin: quietMargin,
//                 background: "#ffffff",
//                 lineColor: "#222222", // softer black to avoid "too dark" prints
//             });

//             // Crisp rendering hint for SVG
//             try {
//                 el.setAttribute("shape-rendering", "crispEdges");
//             } catch {}
//         } else {
//             // Clear barcode if no payload
//             while (el.firstChild) el.removeChild(el.firstChild);
//         }
//     } catch (e) {
//         console.warn("Barcode render failed", e);
//     }
// }

function renderBarcode(forPrint = false) {
    const el = document.getElementById("labelBarcode");
    if (!el) return;
    const payload = buildBarcodePayload();

    try {
        if (window.JsBarcode && payload) {
            // Adjust bar width + spacing for better print readability
            const moduleWidth = forPrint ? 3 : 2; // thicker base module for print
            const barHeight = forPrint ? 90 : 60;
            const quietMargin = forPrint ? 20 : 10; // bigger quiet zone (white space)

            window.JsBarcode(el, payload, {
                format: "CODE128",
                width: moduleWidth,
                height: 300,
                displayValue: false,
                margin: quietMargin,
                marginLeft: quietMargin,
                marginRight: quietMargin,
                background: "#ffffff",
                lineColor: "#222222", // softer than pure black
            });

            // Force crisp rendering
            try {
                el.setAttribute("shape-rendering", "crispEdges");
            } catch {}
        } else {
            while (el.firstChild) el.removeChild(el.firstChild);
        }
    } catch (e) {
        console.warn("Barcode render failed", e);
    }
}

function updatePreview() {
    const now = state.previewTimestamp
        ? new Date(state.previewTimestamp)
        : new Date();
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

    // Update the print button label according to mode
    const printBtn = document.getElementById("printBtn");
    if (printBtn)
        printBtn.textContent =
            state.reprintAvailable && state.lastPrinted ? "Reprint" : "Print";

    // Render barcode as last item
    renderBarcode();
}
