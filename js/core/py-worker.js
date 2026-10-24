// Runs Python (Pyodide) in a worker so a long loop never freezes the page.
// The project's real .py files are copied into the worker's file system on start.

import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs';
import { FILES } from './files.js';

const APP = '/home/pyodide/app';
const WORK = '/home/pyodide/work';

const RUNNER = `
import builtins, io, json, os, runpy, sys, traceback

def _pb_trim(err):
    te = traceback.TracebackException.from_exception(err)
    te.stack = traceback.StackSummary.from_list([f for f in te.stack if f.filename != '<pybench>'])
    return ''.join(te.format())

def _pb_run(code, stdin, filename, as_file):
    buf = io.StringIO()
    lines = list(stdin)

    def fake_input(prompt=''):
        buf.write(str(prompt))
        if not lines:
            raise EOFError('the program asked for more input than you typed in the Input box')
        value = lines.pop(0)
        buf.write(value + '\\n')
        return value

    saved = sys.stdout, sys.stderr, builtins.input
    sys.stdout = sys.stderr = buf
    builtins.input = fake_input
    error = None
    try:
        if as_file:
            runpy.run_path(filename, run_name='__main__')
        else:
            exec(compile(code, filename, 'exec'), {'__name__': '__main__'})
    except SystemExit:
        pass
    except BaseException as err:
        error = _pb_trim(err)
    finally:
        sys.stdout, sys.stderr, builtins.input = saved
    return json.dumps({'out': buf.getvalue(), 'error': error, 'left': len(lines)})

_pb_console = None

def _pb_repl(line, reset=False):
    global _pb_console
    import code
    if reset or _pb_console is None:
        _pb_console = code.InteractiveConsole({'__name__': '__console__'})
    buf = io.StringIO()
    saved = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = buf
    try:
        more = _pb_console.push(line) if line is not None else False
    finally:
        sys.stdout, sys.stderr = saved
    return json.dumps({'out': buf.getvalue(), 'more': more})

def _pb_call(module, fn, args):
    import importlib
    try:
        result = getattr(importlib.import_module(module), fn)(*json.loads(args))
        return json.dumps({'ok': True, 'value': result}, default=repr)
    except Exception as err:
        return json.dumps({'ok': False, 'error': f'{type(err).__name__}: {err}'})
`;

let py = null;

async function boot() {
    const t0 = performance.now();
    py = await loadPyodide();
    const base = new URL('../../python/', import.meta.url);
    await Promise.all(FILES.map(async (path) => {
        const res = await fetch(new URL(path, base));
        if (!res.ok) throw new Error(`could not load ${path}`);
        const full = `${APP}/${path}`;
        py.FS.mkdirTree(full.slice(0, full.lastIndexOf('/')));
        py.FS.writeFile(full, new Uint8Array(await res.arrayBuffer()));
    }));
    py.FS.mkdirTree(WORK);
    py.runPython(`import sys, os\nsys.path.insert(0, '${APP}')\nos.chdir('${WORK}')`);
    py.runPython(RUNNER, { filename: '<pybench>' });
    return { version: py.runPython('import sys; sys.version.split()[0]'), ms: Math.round(performance.now() - t0), files: FILES.length };
}

const ready = boot();

function walk(dir) {
    const out = [];
    for (const name of py.FS.readdir(dir).filter(n => n !== '.' && n !== '..').sort()) {
        const full = `${dir}/${name}`;
        const stat = py.FS.stat(full);
        const isDir = py.FS.isDir(stat.mode);
        out.push({ path: full, name, dir: isDir, size: isDir ? 0 : stat.size });
        if (isDir) out.push(...walk(full));
    }
    return out;
}

const handlers = {
    async info() { return ready; },
    async run({ code, stdin = [], filename = '<cell>', file = null }) {
        await ready;
        const t0 = performance.now();
        if (file) await py.loadPackagesFromImports(py.FS.readFile(`${APP}/${file}`, { encoding: 'utf8' }));
        else await py.loadPackagesFromImports(code);
        const run = py.globals.get('_pb_run');
        const result = JSON.parse(run(code ?? '', py.toPy(stdin), file ? `${APP}/${file}` : filename, Boolean(file)));
        result.ms = Math.round(performance.now() - t0);
        return result;
    },
    async call({ module, fn, args }) {
        await ready;
        const res = JSON.parse(py.globals.get('_pb_call')(module, fn, JSON.stringify(args)));
        if (!res.ok) throw new Error(res.error);
        return res.value;
    },
    async repl({ line = null, reset = false }) {
        await ready;
        return JSON.parse(py.globals.get('_pb_repl')(line, reset));
    },
    async ls({ dir = WORK }) { await ready; return walk(dir); },
    async read({ path, binary = false }) {
        await ready;
        return binary ? Array.from(py.FS.readFile(path)) : py.FS.readFile(path, { encoding: 'utf8' });
    },
    async write({ path, text }) {
        await ready;
        py.FS.mkdirTree(path.slice(0, path.lastIndexOf('/')));
        py.FS.writeFile(path, text);
        return true;
    },
    async remove({ path }) {
        await ready;
        const stat = py.FS.stat(path);
        if (py.FS.isDir(stat.mode)) {
            for (const entry of walk(path).reverse()) entry.dir ? py.FS.rmdir(entry.path) : py.FS.unlink(entry.path);
            py.FS.rmdir(path);
        } else py.FS.unlink(path);
        return true;
    }
};

self.onmessage = async ({ data }) => {
    try {
        self.postMessage({ id: data.id, ok: true, value: await handlers[data.type](data) });
    } catch (err) {
        self.postMessage({ id: data.id, ok: false, error: err.message ?? String(err) });
    }
};
