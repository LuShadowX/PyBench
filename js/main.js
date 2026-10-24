// Router and navigation. Pages are ES modules loaded on demand: #/<page>/<tab>

import { h, $ } from './core/ui.js';
import { store, bus } from './core/store.js';
import { boot, restart } from './core/py.js';

export const SECTIONS = [
    ['Start', [
        ['home', 'Home', 'Overview and quick start'],
        ['map', 'Course map', 'Every syllabus topic and CO → where it is'],
        ['shell', 'Python shell', 'An interactive Python prompt (REPL)']
    ]],
    ['Unit I · Basics', [
        ['setup', 'Setting up Python', 'Python versions, Python on Windows, Hello World'],
        ['basics', 'Variables & expressions', 'Names, NameError, values and types, keywords, operators, order of operations, strings, comments']
    ]],
    ['Unit II · Control flow', [
        ['control', 'Conditions & loops', 'Modulus, random numbers, Boolean logic, if/elif/else, nested conditionals, while, for, nested loops, generalization']
    ]],
    ['Unit III · Data', [
        ['strings', 'Strings', 'Compound data type, length, traversal, slices, comparison, find, looping and counting'],
        ['collections', 'Lists, tuples & dicts', 'List operations, slices, del, nested lists, tuples, dictionaries, sparse matrices, aliasing, sets, sorting']
    ]],
    ['Unit IV · Functions', [
        ['functions', 'Functions & recursion', 'Calls, type conversion and coercion, math functions, parameters, arguments, recursion']
    ]],
    ['Unit V · OOP', [
        ['oop', 'Classes & objects', 'Classes, instances, attributes, inheritance, overriding, data hiding, overloading']
    ]],
    ['Unit VI · Files & regex', [
        ['files', 'Files & exceptions', 'Text files, writing variables, directories, pickling, try / except / else'],
        ['regex', 'Regular expressions', 'Patterns, match vs search, findall, groups, web scraping with regex']
    ]],
    ['Lab', [
        ['practicals', 'The 15 practicals', 'Every program from the INT108 practical list'],
        ['mailguard', 'MailGuard project', 'Phishing mail analyser that uses every unit'],
        ['record', 'Lab record', 'Your practical runs, printable']
    ]]
];

const PAGES = Object.fromEntries(SECTIONS.flatMap(([group, items]) => items.map(([id, title, sub]) => [id, { id, title, sub, group }])));
const loaders = {
    home: () => import('./pages/home.js'), map: () => import('./pages/map.js'), shell: () => import('./pages/shell.js'),
    setup: () => import('./pages/setup.js'), basics: () => import('./pages/basics.js'),
    control: () => import('./pages/control.js'),
    strings: () => import('./pages/strings.js'), collections: () => import('./pages/collections.js'),
    functions: () => import('./pages/functions.js'), oop: () => import('./pages/oop.js'),
    files: () => import('./pages/files.js'), regex: () => import('./pages/regex.js'),
    practicals: () => import('./pages/practicals.js'), mailguard: () => import('./pages/mailguard.js'), record: () => import('./pages/record.js')
};
const EXTRA = ['home', 'map', 'shell', 'record'];

const visitedPages = () => new Set(store.get('visited', []).map(k => k.split('/')[0]));

function renderNav(active) {
    const seen = visitedPages();
    let num = 0;
    $('#nav').replaceChildren(...SECTIONS.map(([group, items]) => h('div', {},
        h('p', { class: 'side__group' }, group),
        ...items.map(([id, title]) => h('a', { href: `#/${id}`, class: id === active ? 'is-active' : '', 'aria-current': id === active ? 'page' : null },
            h('span', { class: 'num' }, EXTRA.includes(id) ? '•' : String(++num)), h('span', {}, title),
            h('span', { class: `tick${seen.has(id) ? ' is-done' : ''}`, 'aria-hidden': 'true' }))))),
    h('div', { class: 'side__progress' }, (() => {
        const ids = Object.keys(PAGES).filter(id => !EXTRA.includes(id));
        const done = ids.filter(id => seen.has(id)).length;
        return [h('p', { class: 'side__group' }, 'Your progress'), h('div', { class: 'meter' }, h('span', { style: { '--v': `${(done / ids.length) * 100}%`, '--c': '#ffd43b' } })), h('small', {}, `${done} of ${ids.length} topic pages opened`)];
    })()));
}

let cleanup = null;
let currentPage = null;
let currentView = null;

async function route() {
    const [, pageId = 'home', tab] = location.hash.split('/');
    const id = PAGES[pageId] ? pageId : 'home';
    const meta = PAGES[id];
    document.title = `${meta.title} | PyBench`;
    $('#crumbs').replaceChildren(meta.group, ' › ', h('b', {}, meta.title));
    $('#tags').replaceChildren(...(TAGS[id] ?? []).map(t => h('span', { class: 'chip' }, t)));
    $('#side').classList.remove('is-open');

    if (id === currentPage && currentView) {
        if (tab) currentView.show?.(tab);
        renderNav(id);
        return;
    }
    cleanup?.();
    cleanup = null;
    currentPage = id;
    const page = $('#page');
    page.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));
    try {
        const module = await loaders[id]();
        page.replaceChildren(h('header', { class: 'page-head' }, h('p', { class: 'kicker' }, meta.group), h('h1', {}, meta.title), h('p', {}, module.intro ?? meta.sub)));
        const result = module.render(page, { tab, go: (to) => { location.hash = `#/${to}`; } }) ?? {};
        currentView = result;
        cleanup = result.cleanup ?? null;
        if (tab) result.show?.(tab);
    } catch (err) {
        console.error(err);
        page.replaceChildren(h('p', { class: 'note note--bad' }, `This page failed to load: ${err.message}`));
    }
    renderNav(id);
    scrollTo(0, 0);
}

const TAGS = {
    setup: ['Unit I', 'CO1'], basics: ['Unit I', 'CO1', 'P1'], control: ['Unit II', 'CO2', 'P12'],
    strings: ['Unit III', 'CO4', 'P6'], collections: ['Unit III', 'CO4', 'P13'], functions: ['Unit IV', 'CO3', 'P7'],
    oop: ['Unit V', 'CO5'], files: ['Unit VI', 'CO6', 'P8–11'], regex: ['Unit VI', 'CO6', 'P14'],
    practicals: ['P1–P15'], mailguard: ['CO1–CO6'], shell: ['CO1']
};

// Python status pill in the top bar
const pill = $('#py-status');
bus.on('py', ({ state, text, ms }) => {
    pill.dataset.state = state;
    pill.querySelector('span').textContent = state === 'ready' ? `${text} · ready in ${(ms / 1000).toFixed(1)} s` : text;
});
pill.addEventListener('click', () => restart('restarted'));

$('#menu-button').addEventListener('click', () => {
    const open = $('#side').classList.toggle('is-open');
    $('#menu-button').setAttribute('aria-expanded', open);
});
bus.on('visited', () => renderNav(currentPage));
addEventListener('hashchange', route);
if (!location.hash) history.replaceState(null, '', '#/home');
route();
boot();

export { PAGES };
