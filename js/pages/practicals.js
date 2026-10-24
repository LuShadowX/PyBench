import { h, card, track } from '../core/ui.js';
import { cell } from '../core/cell.js';
import { source } from '../core/py.js';
import { store, bus } from '../core/store.js';
import { PRACTICALS } from '../core/practicals.js';

export const intro = 'All 15 programs from the INT108 list of practicals. Each one is a real file in python/practicals/ (the same file runs with python p01_arithmetic.py on a computer). Change the input, press Run, or edit the code. Every run is saved to the Lab record.';

export function render(page, { tab }) {
    const list = h('nav', { class: 'prac-list', 'aria-label': 'Practicals' });
    const body = h('div', {});
    let current = null;

    function drawList() {
        const runs = store.get('runs', {});
        list.replaceChildren(...PRACTICALS.map((p, i) => h('button', { type: 'button', class: p.id === current ? 'is-on' : '', onClick: () => show(p.id) },
            h('b', {}, String(i + 1)), h('span', {}, p.file.split('/')[1].replace(/^p\d+_/, '').replace('.py', '').replace(/_/g, ' ')), h('i', { class: runs[p.id] ? 'is-done' : '' }))));
    }

    async function show(id) {
        current = id;
        const p = PRACTICALS.find(x => x.id === id);
        const n = PRACTICALS.indexOf(p) + 1;
        history.replaceState(null, '', `#/practicals/${id}`);
        track(`practicals/${id}`);
        drawList();
        body.replaceChildren(h('p', { class: 'muted' }, 'Loading the program…'));
        const code = await source(p.file);
        const c = cell({ title: p.file, code, stdin: p.stdin, id: p.id, file: p.file, note: p.stdin ? 'Input is filled in with a sample, one line per input() call.' : 'Press Enter at the prompt (empty input) to use the default file data/story.txt.' });
        body.replaceChildren(
            h('div', { class: 'aim' }, h('b', {}, `Practical ${n} · Aim: `), p.aim),
            h('div', { class: 'row', style: { margin: '10px 0' } }, h('span', { class: 'chip' }, `Unit ${p.unit}`), h('span', { class: 'chip' }, p.co), h('span', { class: 'muted', style: { fontSize: '13px' } }, 'Uses: ', p.uses)),
            c.el,
            card('Viva questions', h('dl', { class: 'viva' }, p.viva.flatMap(([q, a]) => [h('dt', {}, q), h('dd', {}, a)]))),
            h('div', { class: 'row', style: { marginTop: '12px', justifyContent: 'space-between' } },
                n > 1 ? h('button', { class: 'btn btn--ghost', type: 'button', onClick: () => show(PRACTICALS[n - 2].id) }, `← Practical ${n - 1}`) : h('span'),
                n < 15 ? h('button', { class: 'btn', type: 'button', onClick: () => show(PRACTICALS[n].id) }, `Practical ${n + 1} →`) : h('a', { class: 'btn', href: '#/record' }, 'Open the lab record →')));
        scrollTo(0, 0);
    }

    page.append(h('div', { class: 'prac-grid' }, list, body));
    const off = bus.on('run', () => (page.isConnected ? drawList() : off()));
    show(PRACTICALS.some(p => p.id === tab) ? tab : 'p01');
    return { show: (t) => t !== current && PRACTICALS.some(p => p.id === t) && show(t), cleanup: off };
}
