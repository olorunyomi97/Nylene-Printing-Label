export function generateUnitNumber() {
    const now = new Date();
    const effective = apply1201Rule(now);
    const doy = getDayOfYear(effective);
    const doyStr = String(doy).padStart(3, '0');
    const seq = getNextDailySequence(effective);
    const seqStr = String(seq).padStart(3, '0');
    return `AC15${doyStr}${seqStr}`;
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diffMs = date - start;
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Math.floor(diffMs / oneDayMs) + 1;
}

const SEQ_STORE_KEY = 'unit_seq_store_v1';
function getNextDailySequence(date) {
    try {
        const y = date.getFullYear();
        const doy = getDayOfYear(date);
        const key = `${y}-${doy}`;
        const raw = localStorage.getItem(SEQ_STORE_KEY);
        const store = raw ? JSON.parse(raw) : {};
        const current = store[key] || 0;
        return current + 1;
    } catch {
        if (!window.__fallbackSeq) window.__fallbackSeq = 0;
        return window.__fallbackSeq + 1;
    }
}
function getAndIncrementDailySequence(date) {
    try {
        const y = date.getFullYear();
        const doy = getDayOfYear(date);
        const key = `${y}-${doy}`;
        const raw = localStorage.getItem(SEQ_STORE_KEY);
        const store = raw ? JSON.parse(raw) : {};
        const current = store[key] || 0;
        const next = current + 1;
        store[key] = next;
        const entries = Object.entries(store)
            .sort((a, b) => (a[0] < b[0] ? -1 : 1))
            .slice(-370);
        const trimmed = Object.fromEntries(entries);
        localStorage.setItem(SEQ_STORE_KEY, JSON.stringify(trimmed));
        return next;
    } catch {
        if (!window.__fallbackSeq) window.__fallbackSeq = 0;
        window.__fallbackSeq += 1;
        return window.__fallbackSeq;
    }
}

// For times between 00:00 and 00:01 inclusive, treat as previous day
function apply1201Rule(date) {
    const d = new Date(date);
    const minutesSinceMidnight = d.getHours() * 60 + d.getMinutes();
    if (minutesSinceMidnight < 1) {
        // subtract one minute to go to previous day window
        d.setMinutes(d.getMinutes() - 1);
    }
    return d;
}

// Commit the currently displayed unit number by incrementing the stored daily sequence.
// Returns the committed unit number string that was just reserved/printed.
export function commitPrintedUnitNumber() {
    const now = new Date();
    const effective = apply1201Rule(now);
    const doy = getDayOfYear(effective);
    const doyStr = String(doy).padStart(3, '0');
    const seq = getAndIncrementDailySequence(effective);
    const seqStr = String(seq).padStart(3, '0');
    return `AC15${doyStr}${seqStr}`;
}

export function generateBigCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 7; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
}

