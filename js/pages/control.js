import { h, s as svgEl, card, table } from '../core/ui.js';
import { cell, codeView, editor } from '../core/cell.js';
import { call } from '../core/py.js';
import { pageTabs, head, field, kv, bars, pyInto, debounce, slider, tile, ic } from '../core/page.js';

export const intro = 'Programs make decisions with if / elif / else and repeat work with while and for. This page covers the modulus operator, Boolean logic, nested conditionals, random numbers, every kind of loop, and the idea of encapsulation and generalization. Code lives in python/pybench/unit2_control.py.';

export function render(page, { tab }) {
    return pageTabs(page, 'control', [
        { id: 'modulus', label: 'Modulus operator', render: modulus },
        { id: 'boolean', label: 'Boolean logic', render: boolean },
        { id: 'conditionals', label: 'Conditionals', render: conditionals },
        { id: 'random', label: 'Random numbers', render: randomTab },
        { id: 'loops', label: 'while & for', render: loops },
        { id: 'tracer', label: 'Loop tracer', render: tracer },
        { id: 'general', label: 'Encapsulation & generalization', render: general }
    ], tab);
}

function modulus(panel) {
    const box = h('div', {});
    const clock = h('div', {});
    const update = debounce(() => {
        pyInto(box, kv, 'pybench.unit2_control', 'modulus_facts', Number(a.value), Number(b.value) || 1);
        call('pybench.unit2_control', 'clock_after', Number(hour.value), Number(later.value)).then(v => {
            clock.replaceChildren(drawClock(v), h('p', { class: 'mono', style: { textAlign: 'center', margin: '6px 0 0' } }, `(${hour.value} + ${later.value}) % 12 → ${v} o'clock`));
        });
    });
    const a = field('a', '17', { type: 'number', width: '90px', onInput: update });
    const b = field('b', '5', { type: 'number', width: '90px', onInput: update });
    const hour = field('now (hour)', '10', { type: 'number', width: '90px', min: 1, max: 12, onInput: update });
    const later = field('hours later', '5', { type: 'number', width: '90px', onInput: update });
    panel.append(
        head('The modulus operator', 'a % b gives the remainder of a // b. It answers "is it even?", "is it divisible?", "what is the last digit?" and makes things wrap around, like a clock.'),
        h('div', { class: 'grid-2' },
            card('a % b', h('div', { class: 'row inputs-row' }, a.el, b.el), box),
            card('Clock arithmetic', h('div', { class: 'row inputs-row' }, hour.el, later.el), clock)),
        cell({ title: 'Uses of %', code: 'n = 2026\nprint(n % 2 == 0)        # even?\nprint(n % 10)             # last digit\nprint(n % 100 // 10)      # tens digit\nseconds = 4000\nprint(seconds // 60, "min", seconds % 60, "s")' }).el
    );
    update();
}

function drawClock(hour) {
    const svg = svgEl;
    const root = svg('svg', { viewBox: '0 0 200 200', width: 180, style: 'display:block;margin:0 auto' });
    root.append(svg('circle', { cx: 100, cy: 100, r: 90, fill: '#fff', stroke: '#2f6b9a', 'stroke-width': 3 }));
    for (let i = 1; i <= 12; i++) {
        const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const t = svg('text', { x: 100 + 72 * Math.cos(ang), y: 105 + 72 * Math.sin(ang), 'text-anchor': 'middle', 'font-size': 14, 'font-weight': i === hour ? 800 : 500, fill: i === hour ? '#c2410c' : '#334155', 'font-family': 'JetBrains Mono' });
        t.textContent = i;
        root.append(t);
    }
    const ang = (hour / 12) * Math.PI * 2 - Math.PI / 2;
    root.append(svg('line', { x1: 100, y1: 100, x2: 100 + 52 * Math.cos(ang), y2: 100 + 52 * Math.sin(ang), stroke: '#0f1b2d', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    root.append(svg('circle', { cx: 100, cy: 100, r: 6, fill: '#ffd43b', stroke: '#0f1b2d', 'stroke-width': 2 }));
    return root;
}

function boolean(panel) {
    const out = h('div', {});
    const update = debounce(async (expr) => {
        try {
            const rows = await call('pybench.unit2_control', 'truth_table', expr, ['a', 'b', 'c'].slice(0, expr.includes('c') ? 3 : 2));
            const cols = rows[0].length - 1;
            out.replaceChildren(h('table', { class: 'data tt' },
                h('thead', {}, h('tr', {}, ['a', 'b', 'c'].slice(0, cols).map(n => h('th', {}, n)), h('th', {}, expr))),
                h('tbody', {}, rows.map(r => h('tr', {}, r.map((v, i) => h('td', { class: v ? 'is-t' : 'is-f', style: i === cols ? { background: '#fffbea' } : null }, String(v))))))));
        } catch (err) { out.replaceChildren(h('p', { class: 'note note--bad' }, err.message)); }
    }, 300);
    const input = field('Boolean expression (use a, b and optionally c)', 'a and not b', { onInput: update, width: '100%' });
    const samples = h('div', { class: 'row' }, ['a and b', 'a or b', 'not a', 'a and not b', '(a or b) and not (a and b)', 'not (a and b) == (not a or not b)', 'a or b and c'].map(v =>
        h('button', { class: 'btn btn--ghost btn--sm mono', type: 'button', onClick: () => { input.input.value = v; update(v); } }, v)));
    panel.append(
        head('Boolean expressions and logic operators', 'A Boolean expression is either True or False. Comparison operators (== != < > <= >=) make them, and / or / not combine them. Python also treats 0, "", [], None as False ("falsy") and everything else as True.'),
        h('div', { class: 'split' },
            card('Truth table generator', h('div', { class: 'stack' }, input.el, samples, out),
                h('p', { class: 'muted', style: { fontSize: '12.5px' } }, ic('truth_table()'), ' compiles the expression and evaluates it for every combination using ', ic('itertools.product'), '.')),
            h('div', {},
                card('Logic operators', table(['x', 'y', 'x and y', 'x or y', 'not x'], [['False', 'False', 'False', 'False', 'True'], ['False', 'True', 'False', 'True', 'True'], ['True', 'False', 'False', 'True', 'False'], ['True', 'True', 'True', 'True', 'False']])),
                cell({ title: 'Truthiness and short-circuit', code: 'print(bool(0), bool(""), bool([]), bool("0"))\nname = ""\nprint(name or "anonymous")   # or returns the first truthy value\nx = 0\nprint(x != 0 and 10 / x > 1)  # safe: and stops at False\nprint(1 < 5 < 10)             # chained comparison' }).el))
    );
    update(input.value);
}

function conditionals(panel) {
    const BRANCHES = [['>= 90', 'O'], ['>= 80', 'A+'], ['>= 70', 'A'], ['>= 60', 'B+'], ['>= 50', 'B'], ['>= 40', 'C'], ['else', 'F']];
    const ladder = h('div', { class: 'flow', style: { flexDirection: 'column', alignItems: 'stretch' } });
    const marks = slider('Marks', 86, { min: 0, max: 100, onInput: () => grade() });
    async function grade() {
        const g = await call('pybench.unit2_control', 'grade', marks.value);
        ladder.replaceChildren(...BRANCHES.map(([cond, letter], i) => h('span', { class: letter === g ? 'is-on' : '' }, `${i === 0 ? 'if' : i === BRANCHES.length - 1 ? 'else' : 'elif'} ${cond === 'else' ? '' : 'marks ' + cond}: grade = "${letter}"`)));
    }
    const ticketOut = h('div', { class: 'verdict is-ok' });
    const age = field('Age', '19', { type: 'number', width: '80px', onInput: () => ticket() });
    const student = h('input', { type: 'checkbox', checked: true, onChange: () => ticket() });
    const weekend = h('input', { type: 'checkbox', onChange: () => ticket() });
    async function ticket() {
        const p = await call('pybench.unit2_control', 'ticket_price', Number(age.value), student.checked, weekend.checked);
        ticketOut.textContent = `Ticket price: ₹${p}`;
    }
    const leapOut = h('div', {});
    const year = field('Year', '2026', { type: 'number', width: '100px', onInput: () => leap() });
    async function leap() {
        const y = Number(year.value);
        const yes = await call('pybench.unit2_control', 'leap_year', y);
        leapOut.replaceChildren(h('div', { class: `verdict ${yes ? 'is-ok' : 'is-warn'}` }, `${y} is ${yes ? '' : 'not '}a leap year`),
            h('p', { class: 'mono muted', style: { fontSize: '12.5px' } }, `${y} % 4 = ${y % 4} → ${y % 100 === 0 && y % 4 === 0 ? `${y} % 100 = 0 → ${y} % 400 = ${y % 400}` : y % 4 === 0 ? `${y} % 100 = ${y % 100}` : 'stop'}`));
    }
    panel.append(
        head('Conditional and nested conditionals', 'if runs a block only when its condition is True. elif and else give alternatives, and only the first matching branch runs. A conditional inside another one is a nested conditional; flatten it with and / elif when you can.'),
        h('div', { class: 'grid-2' },
            card('Chained conditional: grade calculator', marks.el, ladder),
            h('div', {},
                card('Nested conditional: ticket price', h('div', { class: 'row inputs-row' }, age.el, h('label', { class: 'row' }, student, 'student'), h('label', { class: 'row' }, weekend, 'weekend')), ticketOut,
                    codeView('if age < 5:\n    price = 0\nelse:\n    if age >= 60:\n        price = 100\n    else:\n        if student:\n            price = 120\n        else:\n            price = 200\n    if weekend:\n        price += 50')),
                card('Leap year (nested ifs)', year.el, leapOut))),
        cell({ title: 'Write your own', code: 'n = int(input("Enter a number: "))\nif n > 0:\n    if n % 2 == 0:\n        print(n, "is positive and even")\n    else:\n        print(n, "is positive and odd")\nelif n == 0:\n    print("zero")\nelse:\n    print(n, "is negative")', stdin: '7' }).el
    );
    grade(); ticket(); leap();
}

function randomTab(panel) {
    const chart = h('div', {});
    const stats = h('div', { class: 'grid-3' });
    const n = slider('Rolls', 600, { min: 6, max: 6000, step: 6 });
    const seed = field('Seed (empty = random)', '', { type: 'number', width: '140px' });
    async function roll() {
        const rolls = await call('pybench.unit2_control', 'roll_dice', n.value, seed.value === '' ? null : Number(seed.value));
        const freq = await call('pybench.unit2_control', 'frequency', rolls);
        chart.replaceChildren(bars(Object.entries(freq).map(([f, c]) => [`face ${f}`, c]), { max: Math.max(...Object.values(freq)) }));
        stats.replaceChildren(tile('Expected per face', (n.value / 6).toFixed(0)), tile('Average roll', (rolls.reduce((s, r) => s + r, 0) / rolls.length).toFixed(3), 'ideal 3.5'), tile('First rolls', rolls.slice(0, 8).join(' ')));
    }
    const piBox = h('div', {});
    const pts = slider('Random points', 5000, { min: 100, max: 100000, step: 100 });
    async function pi() {
        const v = await call('pybench.unit2_control', 'estimate_pi', pts.value, 7);
        piBox.replaceChildren(h('div', { class: 'verdict is-ok' }, `π ≈ ${v.toFixed(5)}  (error ${(Math.abs(v - Math.PI)).toFixed(5)})`));
    }
    panel.append(
        head('Random numbers', 'The random module gives pseudo-random numbers: random() in [0, 1), randint(a, b) with both ends included, choice(), shuffle(). The same seed always gives the same sequence, which makes programs testable.'),
        h('div', { class: 'grid-2' },
            card('Dice simulator (random numbers in a loop)', h('div', { class: 'row inputs-row' }, n.el, seed.el, h('button', { class: 'btn', type: 'button', onClick: roll }, '🎲 Roll')), chart, stats),
            card('Monte Carlo π', h('p', { class: 'muted', style: { fontSize: '13px' } }, 'Throw random points into a unit square and count how many land inside the quarter circle. inside / total ≈ π / 4.'),
                h('div', { class: 'row inputs-row' }, pts.el, h('button', { class: 'btn', type: 'button', onClick: pi }, 'Estimate')), piBox)),
        h('div', { class: 'cell-grid' },
            cell({ title: 'random module basics', code: 'import random\nprint(random.random())\nprint(random.randint(1, 6))\nprint(random.choice(["rock", "paper", "scissors"]))\ncards = list(range(1, 11))\nrandom.shuffle(cards)\nprint(cards)\nrandom.seed(42)\nprint(random.randint(1, 100), random.randint(1, 100))  # same every time' }).el,
            cell({ title: 'Guess the number', code: 'import random\nsecret = random.randint(1, 20)\ntries = 0\nwhile True:\n    guess = int(input("Guess (1-20): "))\n    tries += 1\n    if guess < secret:\n        print("Too low")\n    elif guess > secret:\n        print("Too high")\n    else:\n        print("Correct in", tries, "tries")\n        break', stdin: '10\n15\n5\n12\n8\n18\n3\n14\n6\n17\n1\n2\n4\n7\n9\n11\n13\n16\n19\n20', note: 'The input box has every number, so the loop always ends.' }).el)
    );
    roll(); pi();
}

function loops(panel) {
    const out = h('pre', { class: 'cell__out', style: { borderRadius: '10px', border: '1px solid var(--line)' } });
    const rows = slider('Rows', 5, { min: 1, max: 12, onInput: () => draw() });
    let kind = 'pyramid';
    const kinds = h('div', { class: 'seg' }, ['triangle', 'pyramid', 'numbers', 'letters'].map(k => h('button', { type: 'button', 'aria-pressed': k === kind, onClick: (e) => { kind = k; [...kinds.children].forEach(b => b.setAttribute('aria-pressed', b === e.target)); draw(); } }, k)));
    async function draw() { out.textContent = await call('pybench.unit2_control', 'pattern', rows.value, kind); }
    panel.append(
        head('while, for and nested loops', 'while repeats as long as a condition is True (you must change something inside or it never stops). for walks over a sequence or a range(). break leaves a loop, continue skips to the next turn, and a loop\'s else runs when it finished without break.'),
        h('div', { class: 'cell-grid' },
            cell({ title: 'while statement', code: '# Collatz: halve if even, 3n + 1 if odd, until we reach 1\nn = 27\nsteps = 0\nwhile n != 1:\n    n = n // 2 if n % 2 == 0 else 3 * n + 1\n    steps += 1\nprint("reached 1 after", steps, "steps")' }).el,
            cell({ title: 'for loop statement', code: 'for i in range(1, 6):\n    print(i, i * i)\n\nfor ch in "LPU":\n    print(ch, ord(ch))\n\nfor i in range(10, 0, -3):\n    print(i, end=" ")' }).el,
            cell({ title: 'Nested for', code: 'for i in range(1, 4):\n    for j in range(1, 4):\n        print(f"{i}x{j}={i*j:<2}", end="  ")\n    print()' }).el,
            cell({ title: 'Nested while (primes)', code: 'n = 2\nwhile n <= 30:\n    d = 2\n    while d * d <= n and n % d != 0:\n        d += 1\n    if d * d > n:\n        print(n, end=" ")\n    n += 1' }).el,
            cell({ title: 'break, continue and loop else', code: 'for n in range(1, 20):\n    if n % 2 == 0:\n        continue          # skip even numbers\n    if n > 9:\n        break             # stop the loop\n    print(n, end=" ")\nprint()\n\nfor d in range(2, 7):\n    if 49 % d == 0:\n        print("49 divisible by", d)\n        break\nelse:\n    print("no divisor between 2 and 6")' }).el,
            cell({ title: 'Random numbers in loops', code: 'import random\nrandom.seed(3)\nheads = 0\nfor _ in range(1000):\n    if random.random() < 0.5:\n        heads += 1\nprint("heads:", heads, "tails:", 1000 - heads)' }).el),
        card('Pattern printer (nested loops)', h('div', { class: 'row inputs-row' }, rows.el, kinds), out)
    );
    draw();
}

const TRACE_SAMPLES = {
    'sum with for': 'total = 0\nfor i in range(1, 5):\n    total = total + i\nprint("total =", total)',
    'while countdown': 'n = 5\nwhile n > 0:\n    print(n)\n    n = n - 2\nprint("done")',
    'nested loops': 'count = 0\nfor i in range(3):\n    for j in range(i):\n        count += 1\nprint(count)',
    'find max': 'nums = [4, 9, 2, 11, 7]\nbest = nums[0]\nfor x in nums:\n    if x > best:\n        best = x\nprint(best)'
};

function tracer(panel) {
    let steps = [];
    let at = 0;
    let timer = null;
    let source = TRACE_SAMPLES['sum with for'];
    const ed = editor(source, { onRun: () => load(), rows: 6 });
    const view = h('div', {});
    const vars = h('div', { class: 'trace-vars' });
    const printed = h('pre', { class: 'cell__out', style: { minHeight: '60px', borderRadius: '10px', border: '1px solid var(--line)' } });
    const pos = h('span', { class: 'mono muted' });
    const range = h('input', { type: 'range', min: 0, max: 0, value: 0, style: { flex: 1 }, 'aria-label': 'Step', onInput: () => show(Number(range.value)) });
    const sel = h('select', { class: 'select', style: { width: 'auto' }, onChange: () => { ed.value = TRACE_SAMPLES[sel.value]; load(); } }, Object.keys(TRACE_SAMPLES).map(k => h('option', { value: k }, k)));

    function show(i) {
        at = Math.max(0, Math.min(steps.length - 1, i));
        range.value = at;
        const [line, v, out] = steps[at];
        const prev = at > 0 ? steps[at - 1][1] : {};
        view.replaceChildren(codeView(source, { mark: line ? [line] : [] }));
        vars.replaceChildren(h('table', { class: 'kv' }, h('tbody', {}, Object.keys(v).length ? Object.entries(v).map(([k, val]) => h('tr', { class: prev[k] !== val ? 'trace-changed' : '' }, h('th', {}, k), h('td', {}, val))) : h('tr', {}, h('td', { class: 'muted' }, 'no variables yet')))));
        printed.textContent = out || ' ';
        pos.textContent = line ? `step ${at + 1} of ${steps.length} · about to run line ${line}` : `finished after ${steps.length - 1} steps`;
    }
    async function load() {
        stop();
        source = ed.value;
        try {
            steps = await call('pybench.unit2_control', 'trace', source);
            range.max = steps.length - 1;
            show(0);
        } catch (err) { view.replaceChildren(h('p', { class: 'note note--bad' }, err.message)); }
    }
    function stop() { clearInterval(timer); timer = null; }
    const play = () => {
        if (timer) return stop();
        if (at >= steps.length - 1) show(0);
        timer = setInterval(() => (at >= steps.length - 1 || !panel.isConnected ? stop() : show(at + 1)), 550);
    };
    panel.append(
        head('Loop tracer', 'Step through a loop line by line and watch the variables change, like a dry run on paper. It uses sys.settrace() in Python to record every line the program executes (', ic('unit2_control.trace()'), ').'),
        h('div', { class: 'tracer' },
            h('div', { class: 'stack' }, view,
                h('div', { class: 'row' },
                    h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onClick: () => show(0) }, '⏮'),
                    h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onClick: () => show(at - 1) }, '◀ Back'),
                    h('button', { class: 'btn btn--sm', type: 'button', onClick: () => show(at + 1) }, 'Step ▶'),
                    h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onClick: play }, '⏯ Play'), range),
                pos),
            h('div', { class: 'stack' }, card('Variables', vars), card('Printed so far', printed))),
        card('Program to trace', h('div', { class: 'stack' }, h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Sample:'), sel, h('button', { class: 'btn btn--sm', type: 'button', onClick: load }, 'Trace this code')), ed.el))
    );
    load();
}

function general(panel) {
    panel.append(
        head('Encapsulation and generalization', 'Encapsulation: wrap a piece of working code in a function so it has a name and can be reused. Generalization: replace a fixed value with a parameter so the function works for more cases. The textbook does it with a multiplication table, in four steps.'),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Step 1 · plain code', code: '# one row of the 2 times table\ni = 1\nwhile i <= 6:\n    print(2 * i, end="\\t")\n    i += 1\nprint()' }).el,
            cell({ title: 'Step 2 · encapsulate it in a function', code: 'def print_multiples():\n    i = 1\n    while i <= 6:\n        print(2 * i, end="\\t")\n        i += 1\n    print()\n\nprint_multiples()' }).el,
            cell({ title: 'Step 3 · generalize: n becomes a parameter', code: 'def print_multiples(n):\n    i = 1\n    while i <= 6:\n        print(n * i, end="\\t")\n        i += 1\n    print()\n\nprint_multiples(3)\nprint_multiples(4)' }).el,
            cell({ title: 'Step 4 · reuse it for a whole table, generalize the size too', code: 'def print_multiples(n, high):\n    for i in range(1, high + 1):\n        print(n * i, end="\\t")\n    print()\n\ndef print_mult_table(high):\n    for n in range(1, high + 1):\n        print_multiples(n, high)\n\nprint_mult_table(5)' }).el)
    );
}
