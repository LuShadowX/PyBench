import { h } from '../core/ui.js';
import { codeView } from '../core/cell.js';
import { runFile, source } from '../core/py.js';
import { store, bus } from '../core/store.js';
import { PRACTICALS } from '../core/practicals.js';

export const intro = 'Every practical you run is recorded here with the code, the input and the output, in the format of a lab file. "Run all 15" runs each program with its sample input. Print the page (Ctrl + P) to save it as a PDF.';

export function render(page) {
    const list = h('div', {});
    const status = h('span', { class: 'muted mono', style: { fontSize: '12.5px' } });

    async function draw() {
        const runs = store.get('runs', {});
        const done = PRACTICALS.filter(p => runs[p.id]).length;
        status.textContent = `${done} of 15 practicals recorded`;
        const blocks = await Promise.all(PRACTICALS.map(async (p, i) => {
            const r = runs[p.id];
            return h('article', { class: 'record-exp' },
                h('h2', {}, `Practical ${i + 1}`),
                h('p', {}, h('b', {}, 'Aim: '), p.aim),
                r ? [
                    h('h4', {}, `Program (${p.file})`), codeView(r.code ?? await source(p.file)),
                    r.stdin?.length && r.stdin.join('') ? [h('h4', {}, 'Input'), h('pre', { class: 'cell__out' }, r.stdin.join('\n'))] : null,
                    h('h4', {}, 'Output'), h('pre', { class: 'cell__out' }, r.out || '', r.error ? h('span', { class: 'out-err' }, r.error) : null),
                    h('p', { class: 'muted', style: { fontSize: '12px' } }, `Run on ${new Date(r.at).toLocaleString('en-IN')}`)
                ] : h('p', { class: 'muted' }, 'Not run yet. ', h('a', { href: `#/practicals/${p.id}` }, 'Open it')));
        }));
        list.replaceChildren(...blocks);
    }

    async function runAll(btn) {
        btn.disabled = true;
        const runs = store.get('runs', {});
        for (const [i, p] of PRACTICALS.entries()) {
            btn.textContent = `Running ${i + 1} / 15…`;
            const stdin = p.stdin ? p.stdin.split('\n') : [''];
            try {
                const r = await runFile(p.file, { stdin });
                runs[p.id] = { at: Date.now(), code: await source(p.file), stdin, out: r.out, error: r.error };
            } catch (err) {
                runs[p.id] = { at: Date.now(), code: await source(p.file), stdin, out: '', error: err.message };
            }
            store.set('runs', runs);
        }
        btn.disabled = false;
        btn.textContent = '▶ Run all 15';
        bus.emit('run', 'all');
        draw();
    }

    const runBtn = h('button', { class: 'btn', type: 'button', onClick: (e) => runAll(e.currentTarget) }, '▶ Run all 15');
    page.append(
        h('div', { class: 'row no-print', style: { marginBottom: '14px' } }, runBtn,
            h('button', { class: 'btn btn--ghost', type: 'button', onClick: () => print() }, '🖨 Print / save PDF'),
            h('button', { class: 'btn btn--ghost', type: 'button', onClick: () => { store.remove('runs'); draw(); } }, 'Clear record'), status),
        list);
    draw();
}
