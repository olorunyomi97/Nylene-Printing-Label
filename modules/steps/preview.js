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

        // Render barcode encoding Box number, Product, and Net weight (LBS)
        // try {
        //     const barcodeEl = document.getElementById("labelBarcode");
        //     if (barcodeEl && window.JsBarcode) {
        //         const barcodeData = `BOX:${state.unitNumber}|PROD:${
        //             state.bigCode || ""
        //         }|NETLB:${Number(state.weights.netLb || 0).toFixed(1)}`;
        //         window.JsBarcode(barcodeEl, barcodeData, {
        //             format: "CODE128",
        //             lineColor: "#000",
        //             width: 2,
        //             height: 60,
        //             displayValue: false,
        //             margin: 0,
        //         });
        //     }
        // } catch (e) {
        //     // Fail silently if barcode cannot render
        // }
        const barcodeData = `
        BOX:${state.unitNumber}|
        PROD:${state.bigCode || ""}|
        NETLB:${Number(state.weights.netLb || 0).toFixed(1)}`;

        console.log(barcodeData, "barcodeData");

        JsBarcode("#labelBarcode", `${state.unitNumber}|${state.bigCode}`, {
            displayValue: false,
        });

        // Update the print button label according to mode
        const printBtn = document.getElementById("printBtn");
        if (printBtn)
            printBtn.textContent =
                state.reprintAvailable && state.lastPrinted
                    ? "Reprint"
                    : "Print";
    }
}
