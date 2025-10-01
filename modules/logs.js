import { state } from './state.js';
import { lbToKg } from './utils/format.js';
 

const LOGS_KEY = 'print_logs_v1';

export function loadLogs() {
    try {
        const raw = localStorage.getItem(LOGS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveLogs(logs) {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function buildLogRecord() {
    const now = new Date();
    const toIso = (d) => new Date(d).toISOString();
    const group = state.activeGroup || '';
    const letter = group ? state.source[group] || '' : '';
    return {
        timestamp: toIso(now),
        unitNumber: state.unitNumber,
        product: state.bigCode,
        sourceGroup: group,
        sourceLetter: letter,
        special: state.source.special || '',
        grossLb: Number(state.weights.grossLb || 0),
        grossKg: lbToKg(Number(state.weights.grossLb || 0)),
        netLb: Number(state.weights.netLb || 0),
        netKg: lbToKg(Number(state.weights.netLb || 0)),
        tareLb: Number(state.weights.tareLb || 0),
        tareKg: lbToKg(Number(state.weights.tareLb || 0)),
    };
}

export async function appendLogRecord() {
    const logs = loadLogs();
    const record = buildLogRecord();
    logs.push(record);
    saveLogs(logs);
    if (state.excelHandle && (await verifyHandleWriteable(state.excelHandle))) {
        await appendToExcelFile(state.excelHandle, logs);
    }
}

async function verifyHandleWriteable(handle) {
    try {
        if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
            const res = await handle.requestPermission({ mode: 'readwrite' });
            if (res !== 'granted') return false;
        }
        return true;
    } catch {
        return false;
    }
}

async function appendToExcelFile(fileHandle, logs) {
    try {
        const file = await fileHandle.getFile();
        const arrayBuffer = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const wsName = wb.SheetNames[0] || 'Logs';
        const ws = wb.Sheets[wsName];
        const existing = XLSX.utils.sheet_to_json(ws);
        const merged = mergeByTimestamp(existing, logs);
        const newWs = XLSX.utils.json_to_sheet(merged);
        wb.Sheets[wsName] = newWs;
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const writable = await fileHandle.createWritable();
        await writable.write(out);
        await writable.close();
    } catch (e) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(logs);
        XLSX.utils.book_append_sheet(wb, ws, 'Logs');
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const writable = await fileHandle.createWritable();
        await writable.write(out);
        await writable.close();
    }
}

function mergeByTimestamp(existingRows, newRows) {
    const seen = new Set(existingRows.map((r) => r.timestamp + ':' + r.unitNumber));
    const merged = existingRows.slice();
    for (const r of newRows) {
        const key = r.timestamp + ':' + r.unitNumber;
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(r);
        }
    }
    return merged;
}

export function bindExcelButton() {
    const excelBtn = document.getElementById('excelBtn');
    if (!excelBtn) return;
    excelBtn.addEventListener('click', async () => {
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `label-logs-${new Date().toISOString().slice(0, 10)}.xlsx`,
                    types: [{ description: 'Excel Files', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
                });
                state.excelHandle = handle;
                const logs = loadLogs();
                await appendToExcelFile(handle, logs);
                alert('Excel log file is set. Future prints will append.');
            } catch (e) {
                console.warn('Excel file selection cancelled or failed', e);
            }
        } else {
            const logs = loadLogs();
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(logs);
            XLSX.utils.book_append_sheet(wb, ws, 'Logs');
            XLSX.writeFile(wb, `label-logs-${new Date().toISOString().slice(0, 10)}.xlsx`);
        }
    });

    const exportBtn = document.getElementById('exportLogsBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => {
        const logs = loadLogs();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(logs);
        XLSX.utils.book_append_sheet(wb, ws, 'Logs');
        XLSX.writeFile(wb, `label-logs-${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
}

