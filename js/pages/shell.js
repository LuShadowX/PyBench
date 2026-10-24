import { h, card } from '../core/ui.js';
import { repl, status } from '../core/py.js';
import { bus } from '../core/store.js';

export const intro = 'The interactive interpreter, like typing python in a terminal. Each line runs as soon as you press Enter, the value of an expression is echoed back, and variables stay alive until you reset. Blocks (if, for, def) continue on "..." lines; press Enter on an empty line to finish them.';

const EXAMPLES = ['2 ** 10', 'name = "LPU"', 'name * 3', 'len(name)', 'import math', 'math.sqrt(2)', '[x * x for x in range(6)]', 'type(3.0)', 'help(len)', '7 / 0'];

export function render(page) {
    const log = h('pre', { class: 'repl__log', 'aria-live': 'polite' });
    const prompt = h('span', {}, '>>>');
    const input = h('textarea', { rows: 1, spellcheck: false, autocapitalize: 'off', 'aria-label': 'Python prompt' });
    const history = [];
    let hpos = 0;
    let busy = false;

    const write = (text, cls) => { log.append(cls ? h('span', { class: cls }, text) : text); log.scrollTop = log.scrollHeight; };
    const banner = () => {
        const v = status()?.version ?? '3.12';
        write(`Python ${v} (Pyodide, WebAssembly) in your browser\nType Python code and press Enter. "Reset" clears all variables.\n`, 'r');
    };

    async function submit(line) {
        if (busy) return;
        busy = true;
        write(`${prompt.textContent} `, 'p');
        write(`${line}\n`);
        if (line.trim()) { history.push(line); hpos = history.length; }
        try {
            const r = await repl(line);
            if (r.out) write(r.out, /Traceback|Error/.test(r.out) ? 'e' : null);
            prompt.textContent = r.more ? '...' : '>>>';
        } catch (err) {
            write(`${err.message}\n`, 'e');
            prompt.textContent = '>>>';
        }
        busy = false;
        input.focus();
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // a line with only the auto-indent counts as empty, so it closes the block
            const line = input.value.trim() ? input.value : '';
            // keep the indentation inside a block, add a level after a colon
            const indent = line.match(/^\s*/)[0];
            input.value = /:\s*$/.test(line) ? indent + '    ' : line.trim() && prompt.textContent === '...' ? indent : '';
            submit(line);
        } else if (e.key === 'ArrowUp' && history.length) {
            e.preventDefault();
            hpos = Math.max(0, hpos - 1);
            input.value = history[hpos];
        } else if (e.key === 'ArrowDown' && history.length) {
            e.preventDefault();
            hpos = Math.min(history.length, hpos + 1);
            input.value = history[hpos] ?? '';
        } else if (e.key === 'Tab') {
            e.preventDefault();
            input.setRangeText('    ', input.selectionStart, input.selectionEnd, 'end');
        }
    });

    async function reset() {
        await repl(null, true);
        log.replaceChildren();
        prompt.textContent = '>>>';
        banner();
    }

    page.append(
        h('div', { class: 'repl' }, log, h('div', { class: 'repl__row', onClick: () => input.focus() }, prompt, input)),
        h('div', { class: 'row', style: { marginTop: '10px' } },
            h('span', { class: 'muted', style: { fontSize: '13px' } }, 'Try:'),
            ...EXAMPLES.map(x => h('button', { class: 'btn btn--ghost btn--sm mono', type: 'button', onClick: () => submit(x) }, x)),
            h('button', { class: 'btn btn--sm', type: 'button', onClick: reset, style: { marginLeft: 'auto' } }, 'Reset')),
        h('div', { class: 'grid-2', style: { marginTop: '14px' } },
            card('Interactive mode vs script mode', h('ul', { class: 'steps' },
                h('li', {}, 'Interactive mode echoes the value of every expression; a script only shows what you print().'),
                h('li', {}, 'Good for trying one thing quickly, checking a type, reading help().'),
                h('li', {}, 'Anything you want to keep belongs in a .py file (script mode).'))),
            card('Keys', h('ul', { class: 'steps' },
                h('li', {}, 'Enter runs the line; Shift + Enter adds a new line.'),
                h('li', {}, '↑ / ↓ go through the history of what you typed.'),
                h('li', {}, 'After a line ending in ":" the next line is indented for you; an empty line ends the block.'))))
    );
    if (status()) banner();
    else { const off = bus.on('py', ({ state }) => { if (state === 'ready') { banner(); off(); } }); }
    repl(null, true);
    input.focus();
}
