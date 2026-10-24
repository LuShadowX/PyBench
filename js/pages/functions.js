import { h, s, card, table } from '../core/ui.js';
import { cell } from '../core/cell.js';
import { call, run } from '../core/py.js';
import { pageTabs, head, field, kv, pyInto, debounce, slider, tile, ic, select } from '../core/page.js';

export const intro = 'Functions give a name to a piece of code, take parameters and return values. This page covers calling built-in functions, type conversion and coercion, the math module, defining your own functions with every kind of parameter, and recursion (CO3). Code: python/pybench/unit4_functions.py.';

export function render(page, { tab }) {
    return pageTabs(page, 'functions', [
        { id: 'calls', label: 'Calls & type conversion', render: calls },
        { id: 'math', label: 'Math functions', render: mathTab },
        { id: 'define', label: 'Adding new functions', render: define },
        { id: 'params', label: 'Parameters & arguments', render: params },
        { id: 'recursion', label: 'Recursion', render: recursion },
        { id: 'uses', label: 'Uses of recursion', render: uses }
    ], tab);
}

function calls(panel) {
    const box = h('div', {});
    const update = debounce((v) => pyInto(box, kv, 'pybench.unit4_functions', 'convert', v));
    const input = field('Text, as input() would return it', '42', { onInput: update, width: '220px' });
    const samples = h('div', { class: 'row' }, ['42', '3.75', '-7', '1e3', 'abc', '', '0', '2+3j', ' 15 '].map(v =>
        h('button', { class: 'btn btn--ghost btn--sm mono', type: 'button', onClick: () => { input.input.value = v; update(v); } }, v === '' ? '(empty)' : `"${v}"`)));
    const coercion = h('div', {});
    pyInto(coercion, (rows) => table(['Expression', 'Result', 'Type'], rows), 'pybench.unit4_functions', 'coercion_examples');
    panel.append(
        head('Function calls, type conversion and coercion', 'A function call is the name followed by arguments in brackets: len("hi"). Type conversion functions (int(), float(), str(), bool(), list()) make a new value of another type, and fail with ValueError if they can\'t. Coercion is the automatic widening Python does in mixed arithmetic: int + float gives float.'),
        h('div', { class: 'grid-2' },
            card('Conversion tester', input.el, samples, box),
            card('Type coercion', coercion, h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'bool → int → float → complex: the narrower type is widened.'))),
        cell({ title: 'Calls and conversion in code', code: 'print(len("Python"), abs(-7), max(3, 9, 4), round(2.675, 2))\nprint(int("17") + 3, int(3.99), int("101", 2))\nprint(float("2.5") * 2, str(42) + "!", list("abc"))\nprint(bool(""), bool("False"))   # non-empty string is True\nprint(type(7 + 2.0), 7 / 2, 7 // 2)\nage = int("nineteen")            # ValueError' }).el
    );
    update('42');
}

function mathTab(panel) {
    const box = h('div', {});
    const x = slider('x', 30, { min: -10, max: 100, onInput: (v) => pyInto(box, kv, 'pybench.unit4_functions', 'math_table', v) });
    panel.append(
        head('Math functions', 'The math module has the common mathematical functions and constants. Import it once, then call them with dot notation: math.sqrt(x).'),
        h('div', { class: 'split' },
            card('math on x', x.el, box),
            cell({ title: 'Using the math module', code: 'import math\nprint(math.pi, math.e)\nprint(math.sqrt(144), math.pow(2, 10), 2 ** 10)\nprint(math.floor(-2.5), math.ceil(-2.5), math.trunc(-2.5))\nprint(math.factorial(10), math.gcd(48, 36), math.lcm(4, 6))\nangle = 30\nprint(round(math.sin(math.radians(angle)), 3))\nprint(math.hypot(3, 4), math.log(1000, 10))\nprint(math.isclose(0.1 + 0.2, 0.3))' }).el)
    );
    pyInto(box, kv, 'pybench.unit4_functions', 'math_table', 30);
}

function define(panel) {
    panel.append(
        head('Adding new functions', 'def name(parameters): followed by an indented body. return sends a value back to the caller (without it the function returns None). A function must be defined before it is called, and the body runs only when it is called.'),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Define and call', code: 'def greet(name):\n    print("Hello,", name)\n\ndef square(n):\n    return n * n\n\ngreet("Riya")\nresult = square(7)\nprint(result, square(square(2)))\nprint(greet("Dev"))   # greet returns None' }).el,
            cell({ title: 'Functions calling functions', code: 'def area(radius):\n    return 3.14159 * radius ** 2\n\ndef distance(x1, y1, x2, y2):\n    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5\n\ndef circle_area(xc, yc, xp, yp):\n    return area(distance(xc, yc, xp, yp))\n\nprint(round(circle_area(1, 2, 4, 6), 2))' }).el,
            cell({ title: 'Local and global scope', code: 'count = 0            # global\n\ndef add():\n    global count\n    count += 1\n\ndef local_only():\n    count = 100      # a new local variable\n    return count\n\nadd(); add()\nprint(count, local_only(), count)' }).el,
            cell({ title: 'Functions are values', code: 'def double(x):\n    return 2 * x\n\nf = double\nprint(f(5))\nprint(list(map(double, [1, 2, 3])))\nsquare = lambda x: x * x\nprint(square(9))\nprint(sorted(["kiwi", "fig", "banana"], key=len))' }).el)
    );
}

function params(panel) {
    const out = h('div', { class: 'grid-3' });
    const items = field('Item prices (comma separated)', '250, 120, 80', { width: '220px', onInput: () => bill() });
    const tax = slider('tax %', 18, { min: 0, max: 28, onInput: () => bill() });
    const disc = field('discount ₹', '50', { type: 'number', width: '100px', onInput: () => bill() });
    async function bill() {
        const prices = items.value.split(',').map(Number).filter(Number.isFinite);
        // bill(*items, tax=..., discount=...) takes keyword arguments, so it is called through a real run
        const code = `from pybench.unit4_functions import bill\nprint(bill(${prices.join(', ')}, tax=${tax.value / 100}, discount=${Number(disc.value) || 0}))`;
        const r = await run(code);
        out.replaceChildren(tile('Call', `bill(${prices.join(', ')}, tax=${tax.value / 100}, discount=${Number(disc.value) || 0})`), tile('Returns', `₹${r.out.trim() || r.error}`), tile('Positional / keyword', `${prices.length} / 2`));
    }
    panel.append(
        head('Parameters and arguments', 'Parameters are the names in the def line; arguments are the values you pass. Python has positional arguments, keyword arguments (name=value), default values, *args (any number of positional arguments, collected into a tuple) and **kwargs (any keyword arguments, collected into a dict).'),
        card('bill(*items, tax=0.18, discount=0)', h('div', { class: 'row inputs-row' }, items.el, tax.el, disc.el), out),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Positional, keyword and default', code: 'def power(base, exp=2):\n    return base ** exp\n\nprint(power(5))          # exp uses its default\nprint(power(2, 10))      # positional\nprint(power(exp=3, base=4))  # keyword, any order\n\ndef intro(name, course="INT108", sem=1):\n    print(f"{name} | {course} | sem {sem}")\n\nintro("Riya")\nintro("Dev", sem=2)' }).el,
            cell({ title: '*args and **kwargs', code: 'def total(*nums):\n    print(type(nums), nums)\n    return sum(nums)\n\nprint(total(1, 2, 3, 4))\n\ndef profile(name, **details):\n    print(name)\n    for k, v in details.items():\n        print(" ", k, "=", v)\n\nprofile("Riya", cgpa=8.9, city="Pune")\nnums = [5, 6, 7]\nprint(total(*nums))       # unpack a list into arguments' }).el,
            cell({ title: 'Mutable default trap', code: 'def add_item(item, basket=[]):\n    basket.append(item)\n    return basket\n\nprint(add_item("pen"))\nprint(add_item("book"))   # the same list again!\n\ndef add_item_ok(item, basket=None):\n    basket = [] if basket is None else basket\n    basket.append(item)\n    return basket\n\nprint(add_item_ok("pen"), add_item_ok("book"))' }).el,
            cell({ title: 'Wrong arguments', code: 'def area(l, w):\n    return l * w\n\nprint(area(3, 4))\nprint(area(3))   # TypeError: missing argument' }).el)
    );
    bill();
}

// draw [label, value, children] as a tree
function drawTree(root) {
    const W = 74;
    const H = 30;
    const GAP_Y = 58;
    let leaves = 0;
    const place = (node, depth) => {
        const kids = node[2].map(k => place(k, depth + 1));
        const x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : (leaves++) * (W + 10);
        return { x, y: depth * GAP_Y, label: node[0], value: node[1], kids };
    };
    const tree = place(root, 0);
    const width = Math.max(1, leaves) * (W + 10);
    let depth = 0;
    const walk = (n, f) => { f(n); n.kids.forEach(k => walk(k, f)); };
    walk(tree, n => { depth = Math.max(depth, n.y); });
    const svg = s('svg', { viewBox: `-6 -6 ${width + 12} ${depth + H + 30}`, width: Math.max(300, width + 12) });
    walk(tree, n => n.kids.forEach(k => svg.append(s('path', { class: 'te', d: `M${n.x + W / 2} ${n.y + H} C${n.x + W / 2} ${n.y + H + 18} ${k.x + W / 2} ${k.y - 18} ${k.x + W / 2} ${k.y}` }))));
    walk(tree, n => svg.append(s('g', { class: `tn${n.kids.length ? '' : ' is-leaf'}`, transform: `translate(${n.x} ${n.y})` },
        s('rect', { width: W, height: H, rx: 7 }), s('text', { x: W / 2, y: 13 }, n.label), s('text', { class: 'tn-val', x: W / 2, y: 25 }, `= ${n.value}`))));
    let count = 0;
    walk(tree, () => count++);
    return { svg, count };
}

function recursion(panel) {
    const box = h('div', { class: 'tree-box' });
    const info = h('div', { class: 'grid-3' });
    const fn = select('Function', [['fib', 'fib(n)'], ['fact', 'factorial(n)']], { onChange: () => draw() });
    const n = slider('n', 5, { min: 0, max: 7, onInput: () => draw() });
    async function draw() {
        const tree = await call('pybench.unit4_functions', 'call_tree', fn.value, n.value);
        const { svg, count } = drawTree(tree);
        box.replaceChildren(svg);
        const [plain, memo] = await call('pybench.unit4_functions', 'count_calls', n.value);
        info.replaceChildren(tile('Calls in this tree', String(count)), tile('Result', String(tree[1])),
            fn.value === 'fib' ? tile('fib with a memo dict', `${memo} calls`, `vs ${plain} without`) : tile('Depth', `${n.value} levels`, 'one call per level'));
    }
    const speed = h('div', {});
    Promise.all([5, 10, 15, 20, 25].map(k => call('pybench.unit4_functions', 'count_calls', k).then(c => [k, ...c]))).then(rows => {
        speed.replaceChildren(table(['n', 'plain fib(n) calls', 'with memo dict'], rows.map(r => r.map(String))));
    });
    panel.append(
        head('Recursion', 'A recursive function calls itself on a smaller version of the problem. It needs a base case that stops the recursion, and every call must move towards it. Each call waits for the one below it, then the results come back up.'),
        card('Recursion tree', h('div', { class: 'row inputs-row' }, fn.el, n.el), box, info,
            h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Yellow boxes are base cases. The tree comes from ', ic('call_tree()'), ' in unit4_functions.py, which builds it with the same recursion.')),
        h('div', { class: 'grid-2' },
            cell({ title: 'Factorial and Fibonacci', code: 'def factorial(n):\n    if n <= 1:            # base case\n        return 1\n    return n * factorial(n - 1)\n\ndef fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(factorial(5), factorial(20))\nprint([fib(i) for i in range(12)])' }).el,
            card('Why fib(n) gets slow (and the fix)', speed, h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Plain fib recomputes the same values again and again; storing them in a dictionary (memoisation) makes it linear.'))),
        cell({ title: 'No base case → RecursionError', code: 'import sys\nprint("limit:", sys.getrecursionlimit())\n\ndef countdown(n):\n    if n == 0:          # remove these two lines\n        return "lift off"  # and it never stops\n    return countdown(n - 1)\n\nprint(countdown(3))\nprint(countdown(-1))  # skips past 0, so no base case is reached' }).el
    );
    draw();
}

function uses(panel) {
    const towers = h('div', {});
    const n = slider('Disks', 3, { min: 1, max: 6, onInput: () => solve() });
    async function solve() {
        const moves = await call('pybench.unit4_functions', 'hanoi', n.value);
        towers.replaceChildren(h('p', { class: 'mono' }, `${moves.length} moves (2^${n.value} - 1)`),
            h('ol', { class: 'steps mono', style: { columns: moves.length > 10 ? 3 : 1, fontSize: '12.5px' } }, moves.map(([d, a, b]) => h('li', {}, `disk ${d}: ${a} → ${b}`))));
    }
    panel.append(
        head('Uses of recursion', 'Recursion fits problems that contain smaller copies of themselves: nested data, divide and conquer (binary search, merge sort, fast power), trees and puzzles like the Tower of Hanoi.'),
        h('div', { class: 'split' },
            card('Tower of Hanoi: hanoi(n, "A", "B", "C")', n.el, towers),
            cell({ title: 'Fast power and digit sum', code: 'def power(base, exp):\n    if exp == 0:\n        return 1\n    half = power(base, exp // 2)   # halves the problem\n    return half * half * (base if exp % 2 else 1)\n\ndef digit_sum(n):\n    return n if n < 10 else n % 10 + digit_sum(n // 10)\n\nprint(power(2, 30), power(3, 5))\nprint(digit_sum(98765))' }).el),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Recursive binary search', code: 'def search(items, target, lo=0, hi=None):\n    hi = len(items) - 1 if hi is None else hi\n    if lo > hi:\n        return -1\n    mid = (lo + hi) // 2\n    if items[mid] == target:\n        return mid\n    if items[mid] < target:\n        return search(items, target, mid + 1, hi)\n    return search(items, target, lo, mid - 1)\n\nnums = [3, 8, 15, 23, 42, 57, 91]\nprint(search(nums, 42), search(nums, 5))' }).el,
            cell({ title: 'Flatten a nested list', code: 'def flatten(items):\n    flat = []\n    for x in items:\n        if isinstance(x, list):\n            flat.extend(flatten(x))   # recursive case\n        else:\n            flat.append(x)             # base case\n    return flat\n\nprint(flatten([1, [2, [3, 4], 5], [[6]], 7]))' }).el)
    );
    solve();
}
