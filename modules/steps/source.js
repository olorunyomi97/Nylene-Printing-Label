import { state, showScreen } from "../state.js";
import { generateUnitNumber } from "../utils/generators.js";
import { loadLogs } from "../logs.js";

export function initSourceStep() {
    document.querySelectorAll(".btn-col[data-group] .option").forEach((btn) => {
        btn.addEventListener("click", () => {
            const group = btn.parentElement.getAttribute("data-group");
            btn.parentElement
                .querySelectorAll(".option")
                .forEach((x) => x.classList.remove("selected"));
            btn.classList.add("selected");
            state.source[group] = btn.dataset.value;
            state.activeGroup = group;
            // Regenerate the unit number to reflect the new prefix mapping
            state.unitNumber = generateUnitNumber(group, state.source[group]);
            state.selectedProduct = null;
            showScreen("products");
            document.dispatchEvent(new CustomEvent("renderProductList"));
        });
    });

    document.querySelectorAll("[data-special]").forEach((btn) => {
        btn.addEventListener("click", () => {
            document
                .querySelectorAll("[data-special]")
                .forEach((x) => x.classList.remove("selected"));
            btn.classList.add("selected");
            // state.source.special = btn.getAttribute("data-special");
            const special = btn.getAttribute("data-special");
            state.source.special = special;
            // Map special to synthetic group/letter for prefix logic
            state.activeGroup = "other";
            if (special === "Unextracted") {
                state.source.other = "UX";
            } else if (special === "Lactam") {
                state.source.other = "LT";
            }
            // Override displayed product name for special selections
            if (special === "Unextracted") {
                state.bigCode = "BS640UX";
            } else if (special === "Lactam") {
                state.bigCode = "Capro";
            }
            // Update displayed unit number with new prefix and skip product selection
            state.unitNumber = generateUnitNumber(
                state.activeGroup,
                state.source.other
            );
            state.selectedProduct = null;
            // Prefill default weights and go directly to weights screen (Enter Tare)
            document.dispatchEvent(new CustomEvent("prefillDefaultWeights"));
            showScreen("weights");
            const gross = document.getElementById("grossWeight");
            if (gross) gross.focus();
        });
    });

    const next = document.getElementById("btnNextFromSource");
    if (next)
        next.addEventListener("click", () => {
            const chosenGroup =
                state.activeGroup ||
                ["silo", "dryer", "compound"].find((g) => state.source[g]);
            if (!chosenGroup || !state.source[chosenGroup]) {
                alert("Please choose a source before continuing.");
                return;
            }
            state.activeGroup = chosenGroup;
            state.selectedProduct = null;
            showScreen("products");
            document.dispatchEvent(new CustomEvent("renderProductList"));
        });

    // Reprint last printed label
    const reprintBtn = document.getElementById("btnReprint");
    if (reprintBtn)
        reprintBtn.addEventListener("click", () => {
            // const snap = state.lastPrinted;
            let snap = state.lastPrinted;
            if (!snap) {
                const logs = loadLogs();
                const last = logs[logs.length - 1];
                if (last) {
                    const source = {
                        silo: null,
                        dryer: null,
                        compound: null,
                        special: last.special || null,
                    };
                    if (last.sourceGroup && last.sourceLetter) {
                        source[last.sourceGroup] = last.sourceLetter;
                    }
                    snap = {
                        printedAt: last.timestamp,
                        unitNumber: last.unitNumber,
                        bigCode: last.product,
                        weights: {
                            grossLb: Number(last.grossLb || 0),
                            netLb: Number(last.netLb || 0),
                            tareLb: Number(last.tareLb || 0),
                        },
                        source,
                        activeGroup: last.sourceGroup || null,
                    };
                    // Cache for subsequent quick reprints
                    state.lastPrinted = snap;
                    state.reprintAvailable = true;
                } else {
                    alert("No previous label to reprint.");
                    return;
                }
            }
            // Save current working state to restore after printing
            const saved = {
                unitNumber: state.unitNumber,
                bigCode: state.bigCode,
                weights: { ...state.weights },
                source: { ...state.source },
                activeGroup: state.activeGroup,
                previewTimestamp: state.previewTimestamp,
            };

            // Apply snapshot state for reprint
            state.unitNumber = snap.unitNumber;
            state.bigCode = snap.bigCode;
            state.weights = { ...snap.weights };
            state.source = { ...snap.source };
            state.activeGroup = snap.activeGroup || null;
            state.previewTimestamp = snap.printedAt || snap.timestamp || null;

            // Render the preview with snapshot data and print
            document.dispatchEvent(new CustomEvent("updatePreview"));
            const restore = () => {
                state.unitNumber = saved.unitNumber;
                state.bigCode = saved.bigCode;
                state.weights = saved.weights;
                state.source = saved.source;
                state.activeGroup = saved.activeGroup;
                state.previewTimestamp = saved.previewTimestamp || null;
                window.removeEventListener("afterprint", restore);
            };
            window.addEventListener("afterprint", restore, { once: true });
            window.print();
        });
}
