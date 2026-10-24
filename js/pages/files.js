import { h, card } from '../core/ui.js';
import { cell } from '../core/cell.js';
import { call, run, fs, WORK } from '../core/py.js';
import { bus } from '../core/store.js';
import { pageTabs, head, field, ic, formatHex } from '../core/page.js';

export const intro = 'Files let a program keep data after it stops. This page writes and reads text files, stores variables, works with directories, pickles Python objects into binary files, and handles the errors that come with all of that using try / except / else / finally (CO6). Every file is created in a real (in-memory) file system you can browse in the explorer. Code: python/pybench/unit6_files.py.';

export function render(page, { tab }) {
    return pageTabs(page, 'files', [
        { id: 'text', label: 'Text files', render: textFiles },
        { id: 'variables', label: 'Writing variables', render: variables },
        { id: 'dirs', label: 'Directories', render: dirs },
        { id: 'pickle', label: 'Pickling', render: pickling },
        { id: 'exceptions', label: 'Exceptions', render: exceptions },
        { id: 'explorer', label: 'File explorer', render: explorer }
    ], tab);
}

// a cell that refreshes any open explorer after it runs
const fcell = (opts) => cell({ ...opts, onResult: () => bus.emit('files') });

function textFiles(panel) {
    panel.append(
        head('Text files: writing and reading', 'open(path, mode) returns a file object. "w" creates or empties the file, "a" appends, "r" (the default) reads. Use with open(...) as f: so the file is closed even if something goes wrong. write() only takes strings and doesn\'t add newlines for you.'),
        h('div', { class: 'cell-grid' },
            fcell({ title: '1 · Write a file', code: 'with open("notes.txt", "w") as f:\n    f.write("Unit VI: files and exceptions\\n")\n    f.write("open() returns a file object\\n")\n    print("written", f.tell(), "characters")\n\nwith open("notes.txt", "a") as f:     # append\n    f.write("with closes the file for me\\n")\n\nprint(open("notes.txt").read())' }).el,
            fcell({ title: '2 · Read it three ways', code: 'with open("notes.txt") as f:\n    print(repr(f.read()))           # the whole file\n\nwith open("notes.txt") as f:\n    print(repr(f.readline()))       # one line\n    print(f.readlines())            # the rest, as a list\n\nwith open("notes.txt") as f:\n    for n, line in enumerate(f, 1): # line by line, memory friendly\n        print(n, line.rstrip())' }).el,
            fcell({ title: 'Write what you type', code: 'lines = []\nwhile True:\n    line = input("line (empty to stop): ")\n    if not line:\n        break\n    lines.append(line)\n\nwith open("diary.txt", "w") as f:\n    f.write("\\n".join(lines) + "\\n")\nprint(len(lines), "lines saved to diary.txt")', stdin: 'Learnt file handling today\nPickle stores whole objects\n' }).el,
            fcell({ title: 'Modes and the file object', code: 'f = open("modes.txt", "w")\nprint(f.name, f.mode, f.closed)\nf.write("abc")\nf.close()\nprint(f.closed)\nwith open("modes.txt", "r+") as f:\n    f.seek(1)\n    f.write("Z")\nprint(open("modes.txt").read())\nprint(open("modes.txt", "rb").read())   # bytes in binary mode' }).el),
        h('p', { class: 'note' }, 'Open the ', h('a', { href: '#/files/explorer' }, 'File explorer'), ' tab to see the files these cells create.')
    );
}

function variables(panel) {
    panel.append(
        head('Writing variables', 'A text file only holds strings, so numbers have to be converted with str() or an f-string before writing, and converted back with int() / float() after reading. This is exactly the problem pickle solves on the next tab.'),
        h('div', { class: 'cell-grid' },
            fcell({ title: 'Save and load variables (save_variables / load_variables)', code: 'from pybench.unit6_files import save_variables, load_variables\n\nsave_variables("profile.txt", name="Lukshya", marks=92, cgpa=8.7)\nprint(open("profile.txt").read())\n\nback = load_variables("profile.txt")\nprint(back)\nprint(type(back["marks"]), type(back["cgpa"]))' }).el,
            fcell({ title: 'By hand with f-strings and split', code: 'marks = [78, 92, 85]\nwith open("marks.txt", "w") as f:\n    f.write(",".join(str(m) for m in marks) + "\\n")\n    f.write(f"{sum(marks) / len(marks):.2f}\\n")\n\nwith open("marks.txt") as f:\n    first, second = f.read().splitlines()\nread_back = [int(x) for x in first.split(",")]\nprint(read_back, float(second))\nprint(read_back == marks)' }).el)
    );
}

function dirs(panel) {
    panel.append(
        head('Directories', 'The os module works with folders: os.getcwd() is where relative paths start, os.listdir() lists a folder, os.mkdir()/os.makedirs() create them, os.path joins and checks paths. Every program runs in a current working directory (here /home/pyodide/work).'),
        h('div', { class: 'cell-grid' },
            fcell({ title: 'Where am I, what is here', code: 'import os\nprint(os.getcwd())\nprint(os.listdir("."))\nprint(os.path.exists("notes.txt"), os.path.isdir("."))\npath = os.path.join("data", "raw", "file.txt")\nprint(path, os.path.splitext(path), os.path.basename(path))' }).el,
            fcell({ title: 'Make a folder tree (make_dirs / tree)', code: 'from pybench.unit6_files import make_dirs, tree\nimport os\n\nmake_dirs("project")\nwith open("project/notes/todo.txt", "w") as f:\n    f.write("finish INT108 project\\n")\nos.rename("project/notes/todo.txt", "project/notes/done.txt")\nprint("\\n".join(tree("project")))' }).el,
            fcell({ title: 'Walk every folder', code: 'import os\nfor folder, subdirs, files in os.walk("/home/pyodide/app/data"):\n    print(folder.replace("/home/pyodide/app/", ""), "->", len(files), "files")' }).el,
            fcell({ title: 'Clean up', code: 'import os, shutil\nif os.path.isdir("project"):\n    shutil.rmtree("project")\nprint("project" in os.listdir("."))\nos.rmdir("not_here")   # FileNotFoundError' }).el)
    );
}

function pickling(panel) {
    const hex = h('pre', { class: 'hexdump' }, '…');
    const info = h('div', {});
    const data = h('textarea', { class: 'input mono', rows: 3 });
    data.value = '{"name": "Riya", "roll": 7, "marks": [92, 85], "passed": True, "cgpa": 8.9}';
    async function dump() {
        const r = await run(`import pickle\nobj = ${data.value}\nwith open("record.pkl", "wb") as f:\n    pickle.dump(obj, f)\nwith open("record.pkl", "rb") as f:\n    back = pickle.load(f)\nprint(type(back).__name__, back == obj)\nprint(back)`);
        if (r.error) { info.replaceChildren(h('p', { class: 'note note--bad' }, r.error.trim().split('\n').pop())); return; }
        const bytes = await fs.readBytes(`${WORK}/record.pkl`);
        hex.innerHTML = formatHex(bytes);
        info.replaceChildren(h('pre', { class: 'cell__out', style: { borderRadius: '8px', border: '1px solid var(--line)' } }, `record.pkl is ${bytes.length} bytes\nloaded back: ${r.out}`));
        bus.emit('files');
    }
    panel.append(
        head('Pickling', 'pickle turns almost any Python object (lists, dicts, your own class instances) into bytes and back. dump() writes to a file opened in "wb" mode, load() reads from "rb". Only unpickle files you trust: loading a pickle can run code.'),
        h('div', { class: 'split' },
            card('Pickle any value', data, h('div', { class: 'row', style: { margin: '8px 0' } }, h('button', { class: 'btn', type: 'button', onClick: dump }, 'pickle.dump → record.pkl')), info),
            card('The bytes inside record.pkl', hex, h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Byte 0x80 starts every pickle, then the protocol number. You can spot the strings ("name", "Riya") between the opcodes.'))),
        h('div', { class: 'cell-grid' },
            fcell({ title: 'Pickling your own objects', code: 'import pickle\nfrom pybench.unit5_oop import Student\n\nclass_list = [Student("Riya", "12301", {"INT108": 92}), Student("Aman", "12302", {"INT108": 78})]\nwith open("students.pkl", "wb") as f:\n    pickle.dump(class_list, f)\n\nwith open("students.pkl", "rb") as f:\n    loaded = pickle.load(f)\nfor s in loaded:\n    print(s)' }).el,
            fcell({ title: 'dumps / loads (bytes in memory)', code: 'import pickle\nb = pickle.dumps((1, "two", [3.0]))\nprint(b[:12], "...", len(b), "bytes")\nprint(pickle.loads(b))\n\nimport json\nprint(json.dumps({"a": [1, 2]}))   # json: text, other languages can read it' }).el)
    );
    dump();
}

function exceptions(panel) {
    const flow = h('div', { class: 'flow' });
    const res = h('div', {});
    const a = field('a', '10', { width: '90px', onInput: () => go() });
    const b = field('b', '0', { width: '90px', onInput: () => go() });
    const val = (t) => (t.trim() !== '' && Number.isFinite(Number(t)) ? Number(t) : t);
    async function go() {
        const [result, path] = await call('pybench.unit6_files', 'safe_divide', val(a.value), val(b.value));
        const STEPS = ['try', 'except ZeroDivisionError', 'except TypeError', 'else (no exception)', 'finally (always runs)'];
        flow.replaceChildren(...STEPS.flatMap((st, i) => [i ? h('em', {}, '→') : null, h('span', { class: path.includes(st) ? (st.startsWith('except') ? 'is-err' : 'is-on') : '' }, st)]).filter(Boolean));
        res.replaceChildren(h('div', { class: `verdict ${result === null ? 'is-warn' : 'is-ok'} mono` }, `safe_divide(${JSON.stringify(val(a.value))}, ${JSON.stringify(val(b.value))}) → result ${result === null ? 'None' : result}`));
    }
    const missing = h('div', {});
    const fname = field('File name', 'missing.txt', { width: '200px', onInput: () => check() });
    async function check() { missing.replaceChildren(h('div', { class: 'verdict is-ok mono' }, await call('pybench.unit6_files', 'read_or_explain', fname.value))); }
    panel.append(
        head('Handling exceptions', 'An exception stops the program with a traceback unless something catches it. try holds the risky code; each except catches one kind of error; else runs only when nothing went wrong; finally runs no matter what (closing files, releasing things).'),
        h('div', { class: 'grid-2' },
            card('Which blocks run? safe_divide(a, b)', h('div', { class: 'row inputs-row' }, a.el, b.el, h('span', { class: 'muted', style: { fontSize: '12.5px' } }, 'try b = 0, or a = "x"')), flow, res),
            card('FileNotFoundError: read_or_explain(path)', fname.el, missing,
                h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Try ', ic('notes.txt'), ' after running the Text files cells, or ', ic('/home/pyodide/app/data/story.txt'), '.'))),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Handling the ZeroDivisionError exception', code: 'print("Give me two numbers, I will divide them.")\nfirst = input("First number: ")\nsecond = input("Second number: ")\ntry:\n    answer = int(first) / int(second)\nexcept ZeroDivisionError:\n    print("You can\'t divide by 0!")\nexcept ValueError:\n    print("Please type whole numbers only.")\nelse:\n    print("Answer:", answer)\nfinally:\n    print("done")', stdin: '5\n0' }).el,
            cell({ title: 'Handling the FileNotFoundError exception', code: 'filenames = ["notes.txt", "alice.txt", "/home/pyodide/app/data/story.txt"]\nfor name in filenames:\n    try:\n        with open(name) as f:\n            contents = f.read()\n    except FileNotFoundError:\n        print(f"Sorry, the file {name} does not exist.")\n    else:\n        print(f"{name} has about {len(contents.split())} words.")' }).el,
            cell({ title: 'Failing silently with pass', code: 'total = 0\nfor value in ["10", "x", "25", "", "7"]:\n    try:\n        total += int(value)\n    except ValueError:\n        pass            # skip bad values on purpose\nprint(total)' }).el,
            cell({ title: 'Raising your own exceptions', code: 'def set_marks(m):\n    if not 0 <= m <= 100:\n        raise ValueError(f"marks must be 0-100, got {m}")\n    return m\n\nfor m in (95, 140):\n    try:\n        print("ok", set_marks(m))\n    except ValueError as err:\n        print("error:", err)\n\nset_marks(-5)   # uncaught: you get a traceback' }).el)
    );
    go(); check();
}

function explorer(panel) {
    const list = h('div', { class: 'fx-list' });
    const view = h('div', {});
    const path = h('span', { class: 'mono muted' });
    let selected = null;
    let root = WORK;
    let off = null;
    async function refresh() {
        if (off && !panel.isConnected) { off(); return; }
        const items = await fs.ls(root);
        list.replaceChildren(...(items.length ? items.map(it => {
            const depth = it.path.slice(root.length + 1).split('/').length - 1;
            return h('button', { type: 'button', class: it.path === selected ? 'is-on' : '', style: { paddingLeft: `${8 + depth * 14}px` }, onClick: () => it.dir ? null : open(it.path) },
                it.dir ? '📁' : '📄', ' ', it.name, it.dir ? null : h('small', {}, `${it.size} B`));
        }) : [h('p', { class: 'muted', style: { padding: '8px' } }, 'No files yet. Run the cells on the other tabs.')]));
    }
    async function open(p) {
        selected = p;
        path.textContent = p;
        const bytes = await fs.readBytes(p);
        const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
        const binary = bytes.some(b => b === 0 || (b < 9)) || /\.(pkl|dat)$/.test(p);
        view.replaceChildren(binary ? h('pre', { class: 'hexdump', html: formatHex(bytes) }) : h('pre', { class: 'cell__out', style: { borderRadius: '10px', border: '1px solid var(--line)', maxHeight: '380px' } }, text || '(empty file)'),
            h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn btn--ghost btn--sm btn--danger', style: { color: '#fff' }, type: 'button', onClick: async () => { await fs.remove(p); selected = null; view.replaceChildren(); path.textContent = ''; refresh(); } }, 'Delete file')));
        refresh();
    }
    const seg = h('div', { class: 'seg' }, [[WORK, 'work (your files)'], ['/home/pyodide/app', 'app (project files)']].map(([r, label]) =>
        h('button', { type: 'button', 'aria-pressed': r === root, onClick: (e) => { root = r; [...seg.children].forEach(x => x.setAttribute('aria-pressed', x === e.target)); refresh(); } }, label)));
    panel.append(
        head('File explorer', 'Everything the cells on this site write lands in /home/pyodide/work. The app folder holds the project\'s own .py files and data, copied in when Python starts. Binary files are shown as a hex dump.'),
        h('div', { class: 'row', style: { marginBottom: '10px' } }, seg, h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onClick: refresh }, '↻ Refresh'), path),
        h('div', { class: 'fx' }, list, view)
    );
    refresh();
    off = bus.on('files', refresh);
}
