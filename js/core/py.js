// Talks to the Python worker. Every call is a promise; a run that takes too long
// kills the worker and starts a fresh one (Python can't be interrupted otherwise).

import { bus } from './store.js';

let worker = null;
let info = null;
let ready = null;
let seq = 0;
const pending = new Map();

function start() {
    worker = new Worker(new URL('./py-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
        const job = pending.get(data.id);
        if (!job) return;
        pending.delete(data.id);
        clearTimeout(job.timer);
        data.ok ? job.resolve(data.value) : job.reject(new Error(data.error));
    };
    worker.onerror = (e) => {
        bus.emit('py', { state: 'error', text: e.message || 'Python could not start' });
    };
    info = null;
    bus.emit('py', { state: 'loading', text: 'Starting Python…' });
    ready = post('info', {}, 120000).then(v => {
        info = v;
        bus.emit('py', { state: 'ready', text: `Python ${v.version}`, ...v });
        return v;
    });
    ready.catch(err => bus.emit('py', { state: 'error', text: err.message }));
}

// the timeout only starts once Python has loaded, so a slow first download isn't a "timeout"
async function send(type, payload = {}, timeout = 15000) {
    if (!worker) start();
    await ready;
    return post(type, payload, timeout);
}

function post(type, payload, timeout) {
    const id = ++seq;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            pending.delete(id);
            restart(`stopped after ${timeout / 1000} s, probably an infinite loop`);
            reject(new Error(`TimeoutError: the program was stopped after ${timeout / 1000} seconds (infinite loop?). Python was restarted.`));
        }, timeout);
        pending.set(id, { resolve, reject, timer });
        worker.postMessage({ id, type, ...payload });
    });
}

export function restart(reason = 'restarted') {
    worker?.terminate();
    for (const job of pending.values()) {
        clearTimeout(job.timer);
        job.reject(new Error(`Python was ${reason}`));
    }
    pending.clear();
    worker = null;
    start();
}

export const status = () => info;
export const boot = () => (worker ? null : start());

// run('print(1)', { stdin: ['5'] }) -> { out, error, ms }
export const run = (code, { stdin = [], timeout = 10000 } = {}) => send('run', { code, stdin }, timeout);
export const runFile = (file, { stdin = [], timeout = 15000 } = {}) => send('run', { file, stdin }, timeout);
// call('pybench.unit3_data', 'slice_info', 'PYTHON', 1, null, 2) -> parsed result
export const call = (module, fn, ...args) => send('call', { module, fn, args });
// one line typed at the >>> prompt; returns { out, more }
export const repl = (line, reset = false) => send('repl', { line, reset });

export const fs = {
    ls: (dir) => send('ls', { dir }),
    read: (path) => send('read', { path }),
    readBytes: (path) => send('read', { path, binary: true }),
    write: (path, text) => send('write', { path, text }),
    remove: (path) => send('remove', { path })
};

export const WORK = '/home/pyodide/work';
export const APP = '/home/pyodide/app';

// source of a project file, straight from the repo
const sources = new Map();
export function source(path) {
    if (!sources.has(path)) sources.set(path, fetch(new URL(`../../python/${path}`, import.meta.url)).then(r => r.text()));
    return sources.get(path);
}
