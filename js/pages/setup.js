import { h, card, table, note } from '../core/ui.js';
import { cell, codeView } from '../core/cell.js';
import { pageTabs, head, kv, pyInto, ic } from '../core/page.js';

export const intro = 'Before writing programs you need Python itself: which version to pick, how to install it on Windows, and how to run your first program in interactive mode and as a script.';

const VERSIONS = [
    ['1991', '0.9', 'Guido van Rossum releases the first version (classes, exceptions, functions, lists, dicts already there)'],
    ['1994', '1.0', 'lambda, map, filter and reduce'],
    ['2000', '2.0', 'list comprehensions, garbage collector, Unicode strings'],
    ['2008', '3.0', 'the big cleanup: print() becomes a function, / is true division, str is Unicode. Not backward compatible'],
    ['2010', '2.7', 'last Python 2 release'],
    ['2016', '3.6', 'f-strings: f"{name}"'],
    ['2020', '2.7 EOL', 'Python 2 reaches end of life on 1 January 2020, no more fixes'],
    ['2021', '3.10', 'match / case pattern matching, better error messages'],
    ['2023', '3.12', 'faster interpreter, f-string improvements (the version PyBench runs in the browser)'],
    ['2024', '3.13', 'new interactive shell with colours, experimental free-threading'],
    ['2025', '3.14', 'template strings, deferred annotations (what I use on my laptop)']
];

const DIFFS = [
    ['print', 'print "hi"', 'print("hi")'],
    ['division', '7 / 2 == 3', '7 / 2 == 3.5 and 7 // 2 == 3'],
    ['input', 'raw_input() for text, input() evaluates', 'input() always returns a str'],
    ['strings', 'bytes by default, u"..." for Unicode', 'Unicode by default, b"..." for bytes'],
    ['range', 'range() builds a list, xrange() is lazy', 'range() is lazy'],
    ['integers', 'int and long', 'one int type with unlimited size']
];

const WIN_STEPS = [
    ['Download', 'Open python.org → Downloads → Windows and download the latest Python 3 "Windows installer (64-bit)". The Microsoft Store version also works for learning.'],
    ['Tick "Add python.exe to PATH"', 'This is the step everyone misses. Without it Command Prompt says "python is not recognized as an internal or external command".'],
    ['Install Now', 'Installs Python, pip, IDLE and the py launcher for the current user. "Customize installation" lets you pick the folder or install for all users.'],
    ['Disable path length limit', 'The last screen offers this. Click it so long folder paths don\'t break pip installs.'],
    ['Check it', 'Open Command Prompt (Win + R, cmd) and run the commands below.']
];

export function render(page, { tab }) {
    return pageTabs(page, 'setup', [
        { id: 'versions', label: 'Python versions', render: versions },
        { id: 'windows', label: 'Python on Windows', render: windows },
        { id: 'hello', label: "Running 'Hello World'", render: hello },
        { id: 'tools', label: 'Editors and tools', render: tools }
    ], tab);
}

function versions(panel) {
    const live = h('div', {}, h('p', { class: 'muted' }, 'Asking Python…'));
    panel.append(
        head('Python versions', 'Python 2 and Python 3 are different languages in small but important ways. Every new program should use Python 3. Minor versions (3.12, 3.13, ...) come out every October.'),
        h('div', { class: 'split' },
            card('Timeline', table(['Year', 'Version', 'What changed'], VERSIONS)),
            h('div', {},
                card('The Python running this page', live,
                    h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'This comes from ', ic('pybench.unit1_basics.environment()'), ', which reads ', ic('sys.version_info'), ' and ', ic('platform'), '.')),
                card('Python 2 vs Python 3', table(['', 'Python 2', 'Python 3'], DIFFS)))),
        cell({ title: 'Check the version from code', code: 'import sys\nprint(sys.version)\nprint(sys.version_info >= (3, 8))\n\nimport keyword\nprint(len(keyword.kwlist), "keywords in this version")' }).el
    );
    pyInto(live, kv, 'pybench.unit1_basics', 'environment');
}

function windows(panel) {
    const checks = h('ol', { class: 'steps' }, WIN_STEPS.map(([t, d]) => h('li', {}, h('b', {}, t), ' – ', d)));
    const dialog = h('div', { class: 'win-dialog' },
        h('div', { class: 'win-dialog__bar' }, h('span', {}, 'Python 3.14.0 (64-bit) Setup'), h('span', {}, '✕')),
        h('div', { class: 'win-dialog__body' },
            h('h4', {}, 'Install Python 3.14.0 (64-bit)'),
            h('p', {}, 'Select Install Now to install Python with default settings, or choose Customize to enable or disable features.'),
            h('div', { class: 'win-opt' }, h('b', {}, '→ Install Now'), h('small', {}, 'C:\\Users\\you\\AppData\\Local\\Programs\\Python\\Python314'), h('small', {}, 'Includes IDLE, pip and documentation')),
            h('div', { class: 'win-opt' }, h('b', {}, '→ Customize installation'), h('small', {}, 'Choose location and features')),
            h('label', { class: 'win-check' }, h('input', { type: 'checkbox', checked: true, disabled: true }), ' Use admin privileges when installing py.exe'),
            h('label', { class: 'win-check is-key' }, h('input', { type: 'checkbox', checked: true, disabled: true }), ' Add python.exe to PATH  ← tick this')));
    panel.append(
        head('Installing Python on Windows', 'The steps I followed on a Windows laptop. On macOS and Linux Python 3 is usually there already (python3), or comes from python.org / Homebrew / apt.'),
        h('div', { class: 'split' }, card('Steps', checks), dialog),
        h('div', { class: 'grid-2' },
            card('Check the install (Command Prompt)', codeView('C:\\> python --version\nPython 3.14.0\n\nC:\\> py -0          # every installed version\n -V:3.14 *        Python 3.14 (64-bit)\n\nC:\\> pip --version\npip 25.2 from ...\\Python314\\Lib\\site-packages\\pip (python 3.14)\n\nC:\\> python hello.py\nHello, World!')),
            card('If something goes wrong',
                table(['Problem', 'Fix'], [
                    ['"python is not recognized"', 'PATH was not ticked. Re-run the installer → Modify → Add Python to environment variables, or use py instead of python'],
                    ['python opens the Microsoft Store', 'Settings → Apps → Advanced app settings → App execution aliases → turn off the python.exe alias'],
                    ['pip is not recognized', 'Use python -m pip install <package>'],
                    ['Two versions clash', 'py -3.14 file.py picks a version explicitly']
                ])))
    );
}

function hello(panel) {
    panel.append(
        head("Running 'Hello World'", 'Two ways to run Python: interactive mode (the >>> prompt, each line runs as you type it) and script mode (save the code in a .py file and run the whole file).'),
        h('div', { class: 'cell-grid' },
            card('Interactive mode', codeView('C:\\> python\nPython 3.14.0 (tags/v3.14.0) on win32\nType "help", "copyright", "credits" or "license" for more information.\n>>> print("Hello, World!")\nHello, World!\n>>> 2 + 3\n5\n>>> exit()'),
                h('p', { class: 'muted', style: { fontSize: '13px' } }, 'In interactive mode the value of an expression is echoed automatically. Try it on the ', h('a', { href: '#/shell' }, 'Python shell'), ' page.')),
            card('Script mode', codeView('# hello.py\nprint("Hello, World!")\n\nC:\\> python hello.py\nHello, World!'),
                h('p', { class: 'muted', style: { fontSize: '13px' } }, 'In a script nothing is echoed, you have to print() what you want to see.'))),
        cell({ title: 'Your first program', code: 'print("Hello, World!")', note: 'One line, one function call, one string. Press Run.' }).el,
        cell({ title: 'A slightly bigger first program', code: 'name = input("What is your name? ")\nyear = int(input("Which year were you born? "))\nprint("Hello,", name + "!")\nprint("You will turn", 2026 - year, "this year.")', stdin: 'Lukshya\n2005', note: 'input() reads one line from the Input box below the code.' }).el,
        note('Common first errors: SyntaxError (missing bracket or quote), IndentationError (stray spaces at the start of a line) and NameError (Print instead of print, Python is case sensitive). Change the code above to see each one.')
    );
}

function tools(panel) {
    panel.append(
        head('Editors and tools', 'You can write Python in anything that saves plain text, but these make it easier.'),
        h('div', { class: 'info-cards' },
            [['IDLE', 'Comes with Python. Shell window plus a simple editor, F5 runs the file.'],
                ['VS Code', 'Free editor; the Python extension gives run buttons, debugging and linting.'],
                ['PyCharm', 'Full IDE from JetBrains, the Community edition is free.'],
                ['Jupyter / Kaggle', 'Notebooks: code and output in cells. Kaggle gives free notebooks in the browser, MailGuard has a notebook version.'],
                ['Command line', 'python file.py runs a script, python -m module runs a module (python -m pybench).'],
                ['Pyodide', 'CPython compiled to WebAssembly; it is what runs Python on this site with no install.']]
                .map(([t, d]) => h('div', { class: 'info-card' }, h('h4', {}, t), h('p', {}, d)))),
        card('Project layout', codeView('PyBench/\n├── index.html, css/, js/       the website (plain HTML, CSS, JS modules)\n└── python/\n    ├── pybench/                one module per unit + mailguard.py\n    │   └── __main__.py         python -m pybench  (menu)\n    ├── practicals/             p01 … p15, the lab programs\n    ├── data/                   story.txt, 10 phishing + 4 normal mails\n    └── tests/                  unittest tests for all of it'))
    );
}
