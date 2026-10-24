import { h, card } from '../core/ui.js';
import { store } from '../core/store.js';
import { cell } from '../core/cell.js';
import { tile } from '../core/page.js';
import { SECTIONS } from '../main.js';
import { FILES } from '../core/files.js';

export const intro = 'My INT108 Python Programming project. Every topic of the six units has a page here with code you can edit and run, plus the 15 lab practicals and a small real project, MailGuard. The Python is real: it runs in your browser through Pyodide (CPython compiled to WebAssembly), and the files it runs are the same .py files in the repository.';

const COS = [
    ['CO1', 'describe the installation of python environment and basics of Python language', 'setup'],
    ['CO2', 'apply the conditional and iterative statements for evaluating the appropriate alternates', 'control'],
    ['CO3', 'explore functions, including recursion, with parameters and arguments in Python', 'functions'],
    ['CO4', 'construct the core data structures like lists, dictionaries, tuples and sets in Python to store, process and sort the data', 'collections'],
    ['CO5', 'apply the concepts of Object-oriented programming as used in Python using encapsulation, polymorphism, and inheritance', 'oop'],
    ['CO6', 'examine file handling operations and effectively apply regular expressions for pattern matching', 'files']
];

const HELLO = `# Try it: change anything and press Run
name = "Lukshya"
course = "INT108"
print(f"Hello, World! I'm {name} and this is {course}.")

for i in range(1, 4):
    print("Python " * i)`;

export function render(page, { go }) {
    const seen = new Set(store.get('visited', []).map(k => k.split('/')[0]));
    const hello = cell({ code: HELLO });

    page.append(
        h('section', { class: 'hero' },
            h('div', {},
                h('h2', {}, 'Learn it by running it.'),
                h('p', {}, 'Each unit page explains a topic in a few lines, then gives you working code and small tools (an expression stepper, a loop tracer, a recursion tree, a regex tester, a file explorer) that are written in Python themselves.'),
                h('div', { class: 'row' },
                    h('button', { class: 'btn', type: 'button', onClick: () => go('setup') }, 'Start with Unit I →'),
                    h('button', { class: 'btn btn--ghost', type: 'button', onClick: () => go('practicals') }, 'Open the practicals'),
                    h('button', { class: 'btn btn--ghost', type: 'button', onClick: () => go('map') }, 'Course map'))),
            hello.el),
        h('div', { class: 'grid-4', style: { marginTop: '16px' } },
            tile('Syllabus units', '6', 'all topics covered'),
            tile('Course outcomes', '6', 'CO1 – CO6 mapped'),
            tile('Lab practicals', '15', 'runnable with your input'),
            tile('Python files', String(FILES.filter(f => f.endsWith('.py')).length), 'loaded into the browser')),
        h('h3', { style: { margin: '22px 0 10px' } }, 'Topics'),
        h('div', { class: 'home-cards' }, SECTIONS.slice(1).flatMap(([group, items]) => items.map(([id, title, sub]) =>
            h('a', { class: `home-card${seen.has(id) ? ' is-seen' : ''}`, href: `#/${id}` }, h('span', { class: 'kick' }, group), h('h4', {}, title), h('p', {}, sub))))),
        h('div', { class: 'grid-2', style: { marginTop: '18px' } },
            card('Course outcomes',
                h('div', { class: 'co-list' }, COS.map(([co, text, to]) => h('div', {}, h('b', {}, co), h('span', {}, text, ' · ', h('a', { href: `#/${to}` }, 'see page')))))),
            card('How this works',
                h('ul', { class: 'steps' },
                    h('li', {}, 'The first time a page needs Python, the browser downloads Pyodide (about 10 MB, cached after that). The pill in the top bar shows when it is ready.'),
                    h('li', {}, 'Python runs in a Web Worker, so an infinite loop does not freeze the page. Anything that runs longer than 10 seconds is stopped and Python restarts.'),
                    h('li', {}, 'input() reads from the Input box under a cell, one line per call, so the lab programs work exactly like they do in a terminal.'),
                    h('li', {}, 'Files you create (practical 9, 11, the Files page) live in a small in-memory file system until you reload.'),
                    h('li', {}, 'The same code also runs on a normal computer: ', h('code', { class: 'inline' }, 'cd python && python -m pybench'), ' gives a menu, and ', h('code', { class: 'inline' }, 'python -m unittest'), ' runs the tests.'),
                    h('li', {}, 'MailGuard also has a notebook version for Kaggle / Jupyter in ', h('a', { href: 'https://github.com/LuShadowX/PyBench/blob/main/notebooks/mailguard_analysis.ipynb', target: '_blank', rel: 'noopener' }, 'notebooks/'), '.')))));
}
