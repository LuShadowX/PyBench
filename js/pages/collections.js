import { h, card, table } from '../core/ui.js';
import { cell } from '../core/cell.js';
import { call, run } from '../core/py.js';
import { pageTabs, head, field, kv, bars, pyInto, debounce, pyRepr, select, ic } from '../core/page.js';

export const intro = 'Lists, tuples, dictionaries and sets are the core data structures (CO4): how to build them, change them, pass them to functions, copy them safely and sort them. Tools call python/pybench/unit3_data.py.';

export function render(page, { tab }) {
    return pageTabs(page, 'collections', [
        { id: 'lists', label: 'Lists', render: lists },
        { id: 'nested', label: 'Nested lists', render: nested },
        { id: 'tuples', label: 'Tuples', render: tuples },
        { id: 'dicts', label: 'Dictionaries', render: dicts },
        { id: 'sparse', label: 'Sparse matrices', render: sparse },
        { id: 'aliasing', label: 'Aliasing & copying', render: aliasing },
        { id: 'sets', label: 'Sets & sorting', render: sets }
    ], tab);
}

const parseList = (text) => text.split(',').map(t => t.trim()).filter(Boolean).map(t => (Number.isFinite(Number(t)) ? Number(t) : t));

function lists(panel) {
    const box = h('div', {});
    const update = debounce(() => pyInto(box, kv, 'pybench.unit3_data', 'list_demo', parseList(values.value)));
    const values = field('List values (comma separated)', '5, 3, 8, 1, 9', { onInput: update, width: '280px' });
    panel.append(
        head('Lists', 'A list is an ordered, changeable sequence in square brackets. It can hold any mix of values. Lists support len(), in, + and *, indexing and slicing like strings, but unlike strings you can change them in place.'),
        h('div', { class: 'split' },
            card('List operations on your values', values.el, box),
            cell({ title: 'Changing a list', code: 'marks = [72, 85, 90]\nmarks.append(66)\nmarks.insert(0, 99)\nmarks[1] = 75            # lists are mutable\nmarks.extend([50, 60])\nprint(marks)\nprint(marks.pop(), marks.index(90), marks.count(75))\nmarks.remove(99)\nmarks.sort(reverse=True)\nprint(marks)' }).el),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Deletion', code: 'nums = [10, 20, 30, 40, 50, 60]\ndel nums[0]\nprint(nums)\ndel nums[1:3]\nprint(nums)\nnums.remove(60)\nprint(nums)\nnums.clear()\nprint(nums, len(nums))' }).el,
            cell({ title: 'Lists and for loops', code: 'cities = ["Jalandhar", "Delhi", "Pune"]\nfor city in cities:\n    print(city.upper())\n\nfor i in range(len(cities)):\n    print(i, cities[i])\n\nsquares = [n * n for n in range(1, 6)]   # list comprehension\nevens = [n for n in range(20) if n % 2 == 0]\nprint(squares, evens)' }).el,
            cell({ title: 'List parameters', code: 'def double_all(items):\n    for i in range(len(items)):\n        items[i] *= 2          # changes the caller\'s list\n\ndef doubled(items):\n    return [x * 2 for x in items]   # builds a new list\n\nnums = [1, 2, 3]\nnew = doubled(nums)\nprint(nums, new)\ndouble_all(nums)\nprint(nums)' }).el,
            cell({ title: 'Membership and slices', code: 'items = ["pen", "book", "lamp", "bag"]\nprint("book" in items, "phone" not in items)\nprint(items[1:3], items[-2:], items[::-1])\nitems[1:3] = ["notebook"]   # slice assignment\nprint(items)' }).el)
    );
    update();
}

function nested(panel) {
    const grid = h('div', {});
    const r = field('rows', '3', { type: 'number', width: '70px', onInput: () => draw() });
    const c = field('cols', '4', { type: 'number', width: '70px', onInput: () => draw() });
    const mat = (m) => h('div', { class: 'matrix', style: { gridTemplateColumns: `repeat(${m[0].length}, 40px)` } }, m.flat().map(v => h('span', {}, String(v))));
    async function draw() {
        const m = await call('pybench.unit3_data', 'matrix', Math.min(8, Number(r.value) || 1), Math.min(8, Number(c.value) || 1));
        const t = await call('pybench.unit3_data', 'transpose', m);
        grid.replaceChildren(h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '24px' } },
            h('div', {}, h('h4', {}, 'm = matrix(rows, cols)'), mat(m)), h('div', {}, h('h4', {}, 'transpose(m)'), mat(t))),
            h('p', { class: 'mono muted', style: { fontSize: '12.5px' } }, pyRepr(m)));
    }
    panel.append(
        head('Nested lists', 'A list can contain other lists. A list of rows is how you store a matrix or a table; m[r][c] reaches one cell.'),
        card('Matrix as a nested list', h('div', { class: 'row inputs-row' }, r.el, c.el), grid),
        cell({ title: 'Working with a nested list', code: 'marks = [\n    ["Aman", 78, 85],\n    ["Riya", 92, 88],\n    ["Dev", 65, 70],\n]\nprint(marks[1])        # a whole row\nprint(marks[1][2])     # one cell\nfor name, m1, m2 in marks:\n    print(f"{name:<5} total {m1 + m2}")\nbest = max(marks, key=lambda row: row[1] + row[2])\nprint("topper:", best[0])' }).el
    );
    draw();
}

function tuples(panel) {
    const out = h('div', {});
    const update = debounce(async () => {
        const nums = parseList(values.value).filter(x => typeof x === 'number');
        if (!nums.length) return;
        const [mn, mx, avg] = await call('pybench.unit3_data', 'min_max_avg', nums);
        out.replaceChildren(h('p', { class: 'mono', style: { fontSize: '12.5px' } }, `low, high, avg = min_max_avg(${pyRepr(nums)})`), kv({ low: mn, high: mx, avg: avg.toFixed(2) }));
    });
    const values = field('Numbers', '72, 85, 90, 66', { onInput: update, width: '220px' });
    const err = h('div', { class: 'verdict is-bad mono' }, '…');
    call('pybench.unit3_data', 'tuple_is_immutable').then(t => { err.textContent = `point[0] = 10  →  ${t}`; });
    panel.append(
        head('Tuples', 'A tuple is like a list that cannot be changed (immutable). That makes it safe to use as a dictionary key or to return several values from a function. Tuple assignment unpacks a tuple into names, which is also how a, b = b, a swaps.'),
        h('div', { class: 'grid-2' },
            card('Tuple as return value', values.el, out),
            card('Mutability', h('p', { class: 'muted', style: { fontSize: '13px' } }, 'From ', ic('tuple_is_immutable()'), ':'), err)),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Creating and unpacking', code: 'point = (3, 4)\nsingle = (5,)        # the comma makes it a tuple\nprint(type(single), len(point))\nx, y = point         # tuple assignment\nprint(x, y)\na, b = 1, 2\na, b = b, a          # swap without a temp variable\nprint(a, b)\nfirst, *rest = (1, 2, 3, 4)\nprint(first, rest)' }).el,
            cell({ title: 'Tuples as return values', code: 'def min_max(nums):\n    return min(nums), max(nums)   # returns one tuple\n\nlow, high = min_max([4, 9, 1, 7])\nprint(low, high)\nq, r = divmod(17, 5)\nprint(q, r)\nprint(divmod(17, 5))' }).el)
    );
    update();
}

function dicts(panel) {
    const chart = h('div', {});
    const update = debounce(async () => {
        const counts = await call('pybench.unit3_data', 'word_count', text.value);
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
        chart.replaceChildren(h('p', { class: 'muted', style: { fontSize: '12.5px' } }, `${Object.keys(counts).length} different words`), bars(top));
    });
    const text = h('textarea', { class: 'input', rows: 4, onInput: () => update() });
    text.value = 'The quick brown fox jumps over the lazy dog. The dog sleeps, the fox runs. A fox is quick and a dog is lazy.';
    const methods = h('div', {});
    pyInto(methods, (log) => h('ul', { class: 'steps mono', style: { fontSize: '12.5px' } }, log.map(l => h('li', {}, l))), 'pybench.unit3_data', 'dict_methods', { roll: 7, name: 'Riya', cgpa: 8.9 });
    panel.append(
        head('Dictionaries: operations and methods', 'A dictionary maps keys to values: {"roll": 7}. Lookup by key is fast, keys must be immutable (str, int, tuple) and unique. get() avoids KeyError, items() gives key-value pairs for looping.'),
        h('div', { class: 'split' },
            card('Word counter (a dict of counts)', text, chart, h('p', { class: 'muted', style: { fontSize: '12.5px' } }, ic('word_count()'), ' uses ', ic('counts[w] = counts.get(w, 0) + 1'), '.')),
            card('Dictionary methods on {roll: 7, name: Riya, cgpa: 8.9}', methods)),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Dictionary operations', code: 'student = {"name": "Riya", "roll": 7}\nstudent["cgpa"] = 8.9        # add\nstudent["roll"] = 8           # update\nprint(student["name"], len(student))\nprint("cgpa" in student)\ndel student["cgpa"]\nprint(student)\nprint(student.get("phone", "not given"))\nprint(student["phone"])       # KeyError' }).el,
            cell({ title: 'Looping over a dictionary', code: 'stock = {"pen": 40, "book": 12, "bag": 5}\nfor item in stock:\n    print(item, end=" ")\nprint()\nfor item, qty in stock.items():\n    print(f"{item:<5} {qty:>3}")\nprint(sum(stock.values()))\nlow = {k: v for k, v in stock.items() if v < 20}\nprint(low)' }).el)
    );
    update();
}

function sparse(panel) {
    const N = 6;
    const cells = new Map([['0,1', 4], ['2,3', 7], ['4,0', 1], ['5,5', 9]]);
    const grid = h('div', { class: 'matrix', style: { gridTemplateColumns: `repeat(${N}, 40px)` } });
    const out = h('div', {});
    async function draw() {
        grid.replaceChildren(...Array.from({ length: N * N }, (_, i) => {
            const key = `${Math.floor(i / N)},${i % N}`;
            const v = cells.get(key) ?? 0;
            return h('button', { type: 'button', class: v ? 'is-set' : '', title: `(${key})`, onClick: () => { const nv = (v + 3) % 10; nv ? cells.set(key, nv) : cells.delete(key); draw(); } }, String(v));
        }));
        const pairs = [...cells].map(([k, v]) => `(${k.replace(',', ', ')}): ${v}`).join(', ');
        const code = `from pybench.unit3_data import SparseMatrix\nm = SparseMatrix(${N}, ${N})\n${[...cells].map(([k, v]) => `m[${k}] = ${v}`).join('\n')}\nprint(m.cells)\nprint(m.saving())\nprint(m[0, 0], "for a cell that was never set")`;
        const r = await run(code);
        out.replaceChildren(h('p', { class: 'mono', style: { fontSize: '12.5px' } }, `dict: {${pairs}}`), h('pre', { class: 'cell__out', style: { borderRadius: '8px', border: '1px solid var(--line)' } }, r.out || r.error));
    }
    panel.append(
        head('Sparse matrices', 'Most cells of a sparse matrix are 0. Instead of a nested list with every zero, store only the non-zero cells in a dictionary keyed by (row, col) tuples, and use get(key, 0) for the rest.'),
        h('div', { class: 'split' },
            card('Click cells to change them', grid, h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Each click adds 3 (mod 10). The result below is the real SparseMatrix class from unit3_data.py run on your grid.')),
            card('What Python stores', out)),
        cell({ title: 'Sparse matrix with a plain dict', code: 'matrix = {(0, 3): 1, (2, 1): 2, (4, 3): 3}\nprint(matrix[(0, 3)])\nprint(matrix.get((1, 3), 0))   # missing cell -> 0\nfor r in range(5):\n    print(" ".join(str(matrix.get((r, c), 0)) for c in range(5)))' }).el
    );
    draw();
}

function aliasing(panel) {
    const out = h('div', {});
    pyInto(out, kv, 'pybench.unit3_data', 'aliasing_demo');
    panel.append(
        head('Aliasing and copying', 'b = a does not copy a list, it gives the same list a second name (an alias), so changes through b show up in a. a[:] or list(a) or copy.copy(a) makes a shallow copy (a new outer list, same inner objects). copy.deepcopy(a) copies everything.'),
        h('div', { class: 'split' },
            card('aliasing_demo(): a = [1, 2, [3, 4]], then alias[0] = "X" and a[2][0] = "Y"', out),
            card('Picture it', h('pre', { class: 'code', style: { fontSize: '12px' } }, 'a ─────┐\n       ├──► ["X", 2, ●]──► ["Y", 4]\nalias ─┘               ▲\n                       │\nshallow ──► [1, 2, ●]──┘   (new outer list, shared inner list)\n\ndeep ─────► [1, 2, ●]──► [3, 4]   (everything copied)'))),
        h('div', { class: 'cell-grid' },
            cell({ title: 'is vs ==', code: 'a = [1, 2, 3]\nb = a\nc = a[:]\nprint(a == b, a is b)   # same list\nprint(a == c, a is c)   # equal values, different list\nb.append(4)\nprint(a, c)\nprint(id(a) == id(b), id(a) == id(c))' }).el,
            cell({ title: 'Copying nested lists', code: 'import copy\ngrid = [[0, 0], [0, 0]]\nshallow = copy.copy(grid)\ndeep = copy.deepcopy(grid)\ngrid[0][0] = 9\nprint(shallow)   # inner list is shared\nprint(deep)\n\nbad = [[0] * 2] * 2      # the same inner list twice!\nbad[0][0] = 1\nprint(bad)' }).el)
    );
}

function sets(panel) {
    const out = h('div', {});
    const update = debounce(() => pyInto(out, kv, 'pybench.unit3_data', 'set_ops', parseList(a.value), parseList(b.value)));
    const a = field('A', 'python, java, c, sql', { onInput: update, width: '220px' });
    const b = field('B', 'c, sql, html, css', { onInput: update, width: '220px' });

    const RECORDS = [['Aman', 78, 19], ['Riya', 92, 18], ['Dev', 78, 20], ['Kavya', 85, 19], ['Ishaan', 64, 21], ['Meera', 92, 20]];
    const sorted = h('div', {});
    const key = select('Sort by', [['marks', 'marks'], ['name', 'name'], ['age', 'age']], { onChange: () => sortIt() });
    const order = select('Order', [['desc', 'high → low'], ['asc', 'low → high']], { onChange: () => sortIt() });
    async function sortIt() {
        const rows = await call('pybench.unit3_data', 'sort_students', RECORDS, key.value, order.value === 'desc');
        sorted.replaceChildren(table(['#', 'Name', 'Marks', 'Age'], rows.map((r, i) => [String(i + 1), ...r.map(String)])));
    }
    const passes = h('div', {});
    pyInto(passes, (p) => h('ol', { class: 'expr-steps' }, p.map(x => h('li', {}, pyRepr(x)))), 'pybench.unit3_data', 'bubble_sort', [29, 10, 14, 37, 13, 5]);

    panel.append(
        head('Sets and sorting the data', 'A set holds unique values with no order: {1, 2, 3}. It removes duplicates and does union, intersection and difference quickly. sorted() and list.sort() put data in order; key= decides what to compare.'),
        h('div', { class: 'grid-2' },
            card('Set operations', h('div', { class: 'row inputs-row' }, a.el, b.el), out),
            card('Sorting records with key=', h('div', { class: 'row inputs-row' }, key.el, order.el), sorted,
                h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Equal marks stay in alphabetical order: the list is sorted by name first, then by the key, and ', ic('sorted()'), ' is stable.'))),
        h('div', { class: 'grid-2' },
            card('Bubble sort, pass by pass: [29, 10, 14, 37, 13, 5]', passes),
            cell({ title: 'Sets in code', code: 'rolls = [3, 5, 3, 6, 1, 5, 5]\nunique = set(rolls)\nprint(unique, len(unique))\nunique.add(2)\nunique.discard(9)   # no error if missing\nprint(4 in unique)\nfrozen = frozenset([1, 2])\nprint({1, 2} <= {1, 2, 3})   # subset\nprint(sorted(unique, reverse=True))' }).el)
    );
    update(); sortIt();
}
