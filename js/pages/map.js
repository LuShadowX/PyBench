import { h, card, table } from '../core/ui.js';
import { store } from '../core/store.js';
import { UNITS, COS } from '../core/syllabus.js';
import { PRACTICALS } from '../core/practicals.js';
import { tile } from '../core/page.js';
import { PAGES } from '../main.js';

export const intro = 'The INT108 syllabus (session 2026-27) topic by topic, with the page and tab where each one is covered and what you can do there. Click any place to jump to it. A green dot means you have opened that tab.';

export function render(page) {
    const seen = new Set(store.get('visited', []));
    const topics = UNITS.reduce((n, [, , t]) => n + t.length, 0);
    const link = (where) => {
        const [pageId, tab] = where.split('/');
        return h('a', { href: `#/${where}` }, `${PAGES[pageId].title} › ${tab}`, seen.has(where) ? h('span', { style: { color: '#22c55e' } }, ' ●') : null);
    };
    page.append(
        h('div', { class: 'grid-4' }, tile('Units', '6 / 6'), tile('Syllabus topics', `${topics} / ${topics}`, 'each mapped below'), tile('Course outcomes', '6 / 6'), tile('Practicals', '15 / 15')),
        card('Course outcomes', table(['CO', 'Statement', 'Where', 'Covered by'], COS.map(([co, text, pages, by]) => [co, text, h('span', {}, pages.map((p, i) => [i ? ', ' : '', h('a', { href: `#/${p}` }, PAGES[p].title)])), by]))),
        ...UNITS.map(([unit, title, rows]) => h('section', { class: 'card map-unit' },
            h('h3', {}, `Unit ${unit}: ${title}`, h('span', { class: 'cov' }, `${rows.length} topics`)),
            table(['Syllabus topic', 'Where', 'What you can do there'], rows.map(([t, where, what]) => [t, link(where), what])))),
        card('List of practicals', table(['#', 'Aim', 'File', 'Unit', 'CO'], PRACTICALS.map((p, i) => [String(i + 1), p.aim, h('a', { href: `#/practicals/${p.id}`, class: 'mono' }, p.file.split('/')[1]), p.unit, p.co]))),
        card('Text books', h('ul', { class: 'steps' },
            h('li', {}, 'Fundamentals of Python – First Programs, Kenneth A. Lambert, Cengage Learning (text book).'),
            h('li', {}, 'Python Programming: Using Problem Solving Approach, Reema Thareja, Oxford University Press (reference).')))
    );
}
