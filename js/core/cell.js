// Editable Python code cell: highlighted editor, optional input box, Run / Reset, output.

import { h } from './ui.js';
import { run, runFile } from './py.js';
import { store, bus } from './store.js';

const KEYWORDS = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' '));
const BUILTINS = new Set('print input len range int float str bool list dict set tuple type id abs sum min max sorted reversed enumerate zip map filter open round isinstance super repr ord chr divmod pow hasattr getattr setattr vars dir iter next any all format hex bin oct object property staticmethod classmethod Exception ValueError TypeError ZeroDivisionError FileNotFoundError NameError IndexError KeyError AttributeError EOFError NotImplementedError'.split(' '));
const TOKEN = /(#[^\n]*)|([rbfuRBFU]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?j?\b)|(@\w+)|([A-Za-z_]\w*)/g;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlight(code) {
    let html = '';
    let last = 0;
    let prev = '';
    for (const m of code.matchAll(TOKEN)) {
        html += esc(code.slice(last, m.index));
        const [text, comment, string, number, deco, word] = m;
        if (comment) html += `<span class="t-com">${esc(text)}</span>`;
        else if (string) html += `<span class="t-str">${esc(text)}</span>`;
        else if (number) html += `<span class="t-num">${text}</span>`;
        else if (deco) html += `<span class="t-dec">${text}</span>`;
        else if (word && KEYWORDS.has(word)) html += `<span class="t-kw">${text}</span>`;
        else if (word && (prev === 'def' || prev === 'class')) html += `<span class="t-def">${text}</span>`;
        else if (word && BUILTINS.has(word)) html += `<span class="t-bi">${text}</span>`;
        else if (word === 'self') html += `<span class="t-self">${text}</span>`;
        else html += esc(text);
        if (word) prev = word;
        last = m.index + text.length;
    }
    return html + esc(code.slice(last)) + '\n';
}

// read-only highlighted block with line numbers
export function codeView(code, { start = 1, mark = [] } = {}) {
    const lines = highlight(code.replace(/\n$/, '')).replace(/\n$/, '').split('\n');
    return h('pre', { class: 'code-view' }, h('code', {
        html: lines.map((l, i) => `<span class="ln${mark.includes(i + start) ? ' is-mark' : ''}"><i>${i + start}</i>${l || ' '}</span>`).join('')
    }));
}

export function editor(code, { onRun, rows } = {}) {
    const pre = h('pre', { class: 'ed__hl', 'aria-hidden': 'true' });
    const area = h('textarea', { class: 'ed__area', spellcheck: false, autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'Python code' });
    area.value = code;
    const gutter = h('div', { class: 'ed__gutter', 'aria-hidden': 'true' });
    const wrap = h('div', { class: 'ed' }, gutter, h('div', { class: 'ed__box' }, pre, area));
    const paint = () => {
        pre.innerHTML = highlight(area.value);
        const n = area.value.split('\n').length;
        gutter.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
        area.style.height = 'auto';
        area.style.height = `${Math.max(area.scrollHeight, (rows ?? 3) * 20 + 20)}px`;
    };
    area.addEventListener('input', paint);
    area.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onRun?.(); return; }
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            area.setRangeText('    ', area.selectionStart, area.selectionEnd, 'end');
            paint();
        }
        if (e.key === 'Enter') {
            // keep indentation, and indent one more level after a colon
            const before = area.value.slice(0, area.selectionStart);
            const line = before.slice(before.lastIndexOf('\n') + 1);
            let indent = line.match(/^\s*/)[0];
            if (/:\s*(#.*)?$/.test(line)) indent += '    ';
            e.preventDefault();
            area.setRangeText('\n' + indent, area.selectionStart, area.selectionEnd, 'end');
            paint();
        }
    });
    requestAnimationFrame(paint);
    paint();
    return { el: wrap, get value() { return area.value; }, set value(v) { area.value = v; paint(); }, area };
}

export function renderOutput(box, result) {
    box.replaceChildren();
    if (result.out) box.append(h('span', {}, result.out));
    if (result.error) box.append(h('span', { class: 'out-err' }, result.error));
    if (!result.out && !result.error) box.append(h('span', { class: 'out-none' }, '(no output)'));
}

// cell({ title, code, stdin, file, note, id }) – file runs a project file instead of the editor text
export function cell({ title, code = '', stdin = null, note, id, file, timeout, onResult } = {}) {
    const ed = editor(code, { onRun: () => go() });
    const input = stdin === null ? null : h('textarea', { class: 'input mono cell__stdin', rows: Math.max(2, String(stdin).split('\n').length), 'aria-label': 'Program input, one value per line' });
    if (input) input.value = stdin;
    const out = h('pre', { class: 'cell__out', 'aria-live': 'polite' }, h('span', { class: 'out-none' }, 'Press Run (or Ctrl + Enter) to execute this code.'));
    const time = h('span', { class: 'cell__time' });
    const runBtn = h('button', { class: 'btn btn--sm', type: 'button', onClick: () => go() }, '▶ Run');
    const reset = h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onClick: () => { ed.value = code; if (input) input.value = stdin; } }, 'Reset');

    async function go() {
        runBtn.disabled = true;
        out.classList.add('is-busy');
        time.textContent = 'running…';
        const lines = input ? input.value.split('\n') : [];
        try {
            const changed = file && ed.value !== code;
            const result = file && !changed ? await runFile(file, { stdin: lines, timeout }) : await run(ed.value, { stdin: lines, timeout });
            renderOutput(out, result);
            time.textContent = `${result.ms} ms`;
            out.classList.toggle('has-error', Boolean(result.error));
            if (id) {
                const log = store.get('runs', {});
                log[id] = { at: Date.now(), code: ed.value, stdin: lines, out: result.out, error: result.error };
                store.set('runs', log);
                bus.emit('run', id);
            }
            onResult?.(result);
        } catch (err) {
            renderOutput(out, { error: err.message });
            out.classList.add('has-error');
            time.textContent = '';
        } finally {
            runBtn.disabled = false;
            out.classList.remove('is-busy');
        }
    }

    const el = h('section', { class: 'cell' },
        title ? h('header', { class: 'cell__head' }, h('h4', {}, title), note ? h('p', {}, note) : null) : null,
        ed.el,
        input ? h('label', { class: 'cell__in' }, h('span', {}, 'Input (one line per input() call)'), input) : null,
        h('div', { class: 'cell__bar' }, runBtn, reset, time),
        out);
    return { el, run: go, editor: ed, out };
}
