// Shared page scaffolding: URL-synced tabs, labelled inputs, result tables and bars.

import { h, tabs } from './ui.js';
import { call } from './py.js';

export function pageTabs(container, pageId, items, tab) {
    const view = tabs(items, {
        app: pageId,
        onChange: (id) => {
            const want = `#/${pageId}/${id}`;
            if (location.hash !== want) history.replaceState(null, '', want);
        }
    });
    container.append(view.el);
    if (tab) view.show(tab);
    return view;
}

export const head = (title, ...text) => h('div', { class: 'app-head' }, h('div', {}, h('h3', {}, title), text.length ? h('p', {}, ...text) : null));

export function field(label, value, { type = 'text', width, onInput, mono = true, ...rest } = {}) {
    const input = h('input', { class: `input${mono ? ' mono' : ''}`, type, value, style: width ? { width } : null, 'aria-label': label, ...rest });
    if (onInput) input.addEventListener('input', () => onInput(input.value));
    return { el: h('label', { class: 'num-field' }, h('span', {}, label), input), input, get value() { return input.value; } };
}

export function select(label, options, { onChange, value } = {}) {
    const el = h('select', { class: 'select', 'aria-label': label },
        options.map(([v, text]) => h('option', { value: v, selected: v === value }, text)));
    if (onChange) el.addEventListener('change', () => onChange(el.value));
    return { el: h('label', { class: 'num-field' }, h('span', {}, label), el), input: el, get value() { return el.value; } };
}

export function slider(label, value, { min, max, step = 1, onInput } = {}) {
    const out = h('b', { class: 'mono' }, String(value));
    const input = h('input', { type: 'range', min, max, step, value, 'aria-label': label });
    input.addEventListener('input', () => { out.textContent = input.value; onInput?.(Number(input.value)); });
    return { el: h('label', { class: 'slider-field' }, h('span', {}, label, ' ', out), input), input, get value() { return Number(input.value); } };
}

// JSON from Python back into Python-looking text: True, None, [1, 2]
export function pyRepr(v, top = true) {
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (v === null || v === undefined) return 'None';
    if (typeof v === 'string') return top ? v : `'${v}'`;
    if (Array.isArray(v)) return `[${v.map(x => pyRepr(x, false)).join(', ')}]`;
    if (typeof v === 'object') return `{${Object.entries(v).map(([k, x]) => `'${k}': ${pyRepr(x, false)}`).join(', ')}}`;
    return String(v);
}
const show = (v) => pyRepr(v);

export function kv(obj) {
    return h('table', { class: 'kv' }, h('tbody', {}, Object.entries(obj).map(([k, v]) => h('tr', {}, h('th', {}, k), h('td', {}, show(v))))));
}

export function bars(rows, { color, max } = {}) {
    const top = max ?? Math.max(1, ...rows.map(r => r[1]));
    return h('div', { class: 'bars' }, rows.map(([label, value]) => h('div', { class: 'bar-row' },
        h('span', {}, String(label)), h('div', { class: 'bar' }, h('i', { style: { '--v': `${(100 * value) / top}%`, '--c': color } })), h('b', {}, String(value)))));
}

export const tile = (label, value, sub) => h('div', { class: 'stat' }, h('span', {}, label), h('b', { class: 'mono' }, value), sub ? h('small', { class: 'muted' }, sub) : null);

export const ic = (text) => h('code', { class: 'inline' }, text);

// Calls a Python function from the project and renders the result (or the error) into box.
export async function pyInto(box, render, module, fn, ...args) {
    box.classList.add('is-busy');
    try {
        const value = await call(module, fn, ...args);
        box.replaceChildren(render(value));
        return value;
    } catch (err) {
        box.replaceChildren(h('p', { class: 'note note--bad' }, err.message));
        return null;
    } finally {
        box.classList.remove('is-busy');
    }
}

export const debounce = (fn, ms = 250) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

// classic hex dump: offset, 16 bytes, printable characters
export function formatHex(bytes) {
    const esc = (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);
    const rows = [];
    for (let i = 0; i < bytes.length && i < 1024; i += 16) {
        const chunk = bytes.slice(i, i + 16);
        const hex = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ');
        const ascii = chunk.map(b => (b >= 32 && b < 127 ? esc(String.fromCharCode(b)) : '.')).join('');
        rows.push(`<span class="hx-a">${i.toString(16).padStart(4, '0')}</span>  ${hex}  <span class="hx-c">${ascii}</span>`);
    }
    if (bytes.length > 1024) rows.push(`<span class="hx-a">… ${bytes.length - 1024} more bytes</span>`);
    return rows.join('\n');
}
