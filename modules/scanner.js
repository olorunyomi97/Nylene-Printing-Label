// Keyboard-wedge style scanner listener
// Exports initScanner(cb) where cb receives { raw, parsed, info, error }

function parsePayload(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const parts = raw.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const getAfter = (label) => {
        const idx = parts.indexOf(label);
        if (idx !== -1 && idx + 1 < parts.length) return parts[idx + 1];
        return null;
    };

    const parsed = {};
    const unit = getAfter('UN');
    const product = getAfter('PR');
    const src = getAfter('SRC');
    const special = getAfter('SP');
    const net = getAfter('NET');
    const tar = getAfter('TAR');
    const gro = getAfter('GRO');

    if (unit) parsed.unitNumber = unit;
    if (product) parsed.product = product;
    if (src) parsed.src = src;
    if (special) parsed.special = special;
    if (net && !Number.isNaN(Number(net))) parsed.net = Number(net);
    if (tar && !Number.isNaN(Number(tar))) parsed.tare = Number(tar);
    if (gro && !Number.isNaN(Number(gro))) parsed.gross = Number(gro);

    return Object.keys(parsed).length ? parsed : null;
}

function deriveInfo(parsed) {
    if (!parsed || !parsed.src) return null;
    const m = /^([A-Za-z]+)-([A-Za-z])$/.exec(parsed.src);
    if (m) {
        return { sourceGroup: m[1].toLowerCase(), sourceLetter: m[2].toUpperCase() };
    }
    return { sourceGroup: String(parsed.src), sourceLetter: '' };
}

export function initScanner(onScan) {
    // If already initialized, avoid multiple listeners
    if (window.__scannerInitialized) return;
    window.__scannerInitialized = true;

    let buffer = '';
    let lastTs = 0;
    let timeoutId = 0;

    const reset = () => {
        buffer = '';
        lastTs = 0;
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = 0;
        }
    };

    const finalize = () => {
        if (!buffer) return;
        const raw = buffer;
        reset();
        let parsed = null;
        let info = null;
        let error = null;
        try {
            parsed = parsePayload(raw);
            info = deriveInfo(parsed);
        } catch (e) {
            error = e;
        }
        try {
            if (typeof onScan === 'function') onScan({ raw, parsed, info, error });
        } catch {
            // ignore handler failures
        }
    };

    window.addEventListener('keydown', (e) => {
        const target = e.target;
        const isEditable = target && (
            target.isContentEditable ||
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT'
        );

        // We still want to capture scans even if focus is in an input, but we try
        // to prevent text from being entered if the cadence looks like a scanner.
        const now = Date.now();
        const delta = now - lastTs;

        if (e.key === 'Enter') {
            // End of scan sequence
            if (buffer) e.preventDefault();
            finalize();
            return;
        }

        if (e.key.length !== 1) {
            // Ignore control keys other than Enter
            return;
        }

        // If the timing gap is large, treat as new sequence (likely human typing)
        if (delta > 150) {
            buffer = '';
        }

        buffer += e.key;
        lastTs = now;

        // If this looks like a scanner (rapid input), prevent it from populating inputs
        if (isEditable && delta < 40) {
            e.preventDefault();
        }

        // Debounce finalize if no further keys arrive shortly
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(finalize, 180);
    });
}

