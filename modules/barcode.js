// Minimal Code39 renderer + JsBarcode (CODE128) with SVG/canvas support
export function drawBarcode(targetEl, text) {
    // Prefer JsBarcode (CODE128) when available for standards-compliant scanning
    if (window.JsBarcode && targetEl) {
        try {
            // Compute a sensible height: when rotated 90deg in CSS, the JsBarcode
            // "height" should roughly match the unrotated container width.
            const rect = typeof targetEl.getBoundingClientRect === 'function'
                ? targetEl.getBoundingClientRect()
                : { width: targetEl.width || 300, height: targetEl.height || 120 };
            const margin = 24;
            const heightPx = Math.max(80, Math.floor((rect.width || 120) - margin * 2));

            // Clear previous drawing/content
            if (typeof targetEl.getContext === 'function') {
                const ctx = targetEl.getContext('2d');
                ctx.clearRect(0, 0, targetEl.width, targetEl.height);
            } else {
                targetEl.innerHTML = '';
            }

            // Render CODE128 for broader character support
            window.JsBarcode(targetEl, String(text || ''), {
                format: 'CODE128',
                displayValue: false,
                background: '#ffffff',
                lineColor: '#000000',
                margin,
                // Module width in px; thicker bars improve low-cost scanner reliability
                width: 2.4,
                height: heightPx,
                textMargin: 0,
                valid: function () { /* no-op; barcode data is always alphanumeric */ },
            });
            // Improve rendering quality for SVG output
            if (targetEl && targetEl.tagName && targetEl.tagName.toLowerCase() === 'svg') {
                targetEl.setAttribute('shape-rendering', 'crispEdges');
                targetEl.style.background = '#ffffff';
            }
            return;
        } catch (e) {
            // Fall through to basic renderer on any error
        }
    }

    // Fallback only supports <canvas>
    if (!targetEl || typeof targetEl.getContext !== 'function') return;

    // Fallback: Minimal Code39 renderer (uppercase limited charset)
    const canvas = targetEl;
    const ctx = canvas.getContext("2d");
    // White background for reliable scanning
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const code39 = {
        0: "101001101101",
        1: "110100101011",
        2: "101100101011",
        3: "110110010101",
        4: "101001101011",
        5: "110100110101",
        6: "101100110101",
        7: "101001011011",
        8: "110100101101",
        9: "101100101101",
        A: "110101001011",
        B: "101101001011",
        C: "110110100101",
        D: "101011001011",
        E: "110101100101",
        F: "101101100101",
        G: "101010011011",
        H: "110101001101",
        I: "101101001101",
        J: "101011001101",
        K: "110101010011",
        L: "101101010011",
        M: "110110101001",
        N: "101011010011",
        O: "110101101001",
        P: "101101101001",
        Q: "101010110011",
        R: "110101011001",
        S: "101101011001",
        T: "101011011001",
        U: "110010101011",
        V: "100110101011",
        W: "110011010101",
        X: "100101101011",
        Y: "110010110101",
        Z: "100110110101",
        "-": "100101011011",
        ".": "110010101101",
        " ": "100110101101",
        $: "100100100101",
        "/": "100100101001",
        "+": "100101001001",
        "%": "101001001001",
        "*": "100101101101",
    };
    const content = `*${(text || "").toString().toUpperCase()}*`;
    const quiet = 24;
    const narrow = 3;
    const wide = narrow * 3;
    let x = quiet;
    const y = quiet;
    const height = Math.max(40, canvas.height - quiet * 2);
    ctx.fillStyle = "#000";
    for (const ch of content) {
        const pattern = code39[ch];
        if (!pattern) continue;
        for (let i = 0; i < pattern.length; i++) {
            const isBar = i % 2 === 0;
            const isWide = pattern[i] === "1";
            const w = isWide ? wide : narrow;
            if (isBar) ctx.fillRect(x, y, w, height);
            x += w;
        }
        x += narrow;
    }
}
