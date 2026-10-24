import { h, card, table } from '../core/ui.js';
import { cell } from '../core/cell.js';
import { call, run } from '../core/py.js';
import { pageTabs, head, field, kv, pyInto, debounce, ic } from '../core/page.js';

export const intro = 'Variables, values and types, operators and the order Python evaluates them in, string operations, composition and comments. The small tools on this page call functions from python/pybench/unit1_basics.py.';

export function render(page, { tab }) {
    return pageTabs(page, 'basics', [
        { id: 'names', label: 'Variables & names', render: names },
        { id: 'types', label: 'Values & types', render: types },
        { id: 'operators', label: 'Operators & order', render: operators },
        { id: 'strings', label: 'String operations', render: strings },
        { id: 'comments', label: 'Composition & comments', render: comments }
    ], tab);
}

function names(panel) {
    const verdict = h('div', { class: 'verdict' }, '…');
    const check = debounce(async (name) => {
        try {
            const [ok, why] = await call('pybench.unit1_basics', 'check_name', name);
            verdict.className = `verdict ${ok ? (why === 'valid name' ? 'is-ok' : 'is-warn') : 'is-bad'}`;
            verdict.textContent = `${ok ? '✓' : '✗'} ${name || '(empty)'}: ${why}`;
        } catch (err) { verdict.textContent = err.message; }
    });
    const input = field('Type a variable name', 'total_marks', { onInput: check, width: '260px' });
    const examples = h('div', { class: 'row' }, ['total_marks', '2nd_place', 'for', 'my-name', 'list', 'Score', '_temp', 'rollNo'].map(n =>
        h('button', { class: 'btn btn--ghost btn--sm mono', type: 'button', onClick: () => { input.input.value = n; check(n); } }, n)));
    const kw = h('div', { class: 'kw-grid' }, 'loading keywords…');
    panel.append(
        head('Naming and using variables', 'A variable is a name that refers to a value. Assignment (=) creates the name. Names can have letters, digits and underscores, cannot start with a digit, are case sensitive, and cannot be one of the keywords.'),
        h('div', { class: 'split' },
            card('Name checker', h('div', { class: 'stack' }, input.el, verdict, examples),
                h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Uses ', ic('str.isidentifier()'), ', ', ic('keyword.iskeyword()'), ' and the builtins module.')),
            card('Keywords (reserved words)', kw)),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Assignment', code: 'message = "INT108"\nn = 17\npi = 3.14159\nx = y = 0            # chained assignment\na, b = 5, 10          # multiple assignment\nn = n + 1             # a variable can be reassigned\nprint(message, n, pi, x, y, a, b)' }).el,
            cell({ title: 'Avoiding NameError', code: 'score = 90\nprint(score)\nprint(Score)   # Python is case sensitive', note: 'Run it, read the error, then fix the spelling.' }).el)
    );
    check('total_marks');
    // keyword.kwlist is a list, not a function, so read it with a tiny run
    run('import keyword\nprint(" ".join(keyword.kwlist))').then(r => {
        kw.replaceChildren(...r.out.trim().split(' ').map(k => h('span', {}, k)));
    });
}

function types(panel) {
    const box = h('div', {});
    const inspect = debounce((text) => pyInto(box, kv, 'pybench.unit1_basics', 'literal_type', text));
    const input = field('Type any value (a literal)', '3.14', { onInput: inspect, width: '260px' });
    const samples = h('div', { class: 'row' }, ['42', '3.14', '"hello"', 'True', 'None', '[1, 2, 3]', '(1, 2)', "{'a': 1}", '{1, 2}', '2+3j', "b'hi'"].map(v =>
        h('button', { class: 'btn btn--ghost btn--sm mono', type: 'button', onClick: () => { input.input.value = v; inspect(v); } }, v)));
    panel.append(
        head('Values and types', 'Every value has a type. type() tells you which; id() gives its identity (where it lives in memory). Some types can be changed after creation (mutable), most basic ones cannot.'),
        h('div', { class: 'split' },
            card('Type inspector', h('div', { class: 'stack' }, input.el, samples, box)),
            card('The basic types', table(['Type', 'Example', 'Mutable'], [
                ['int', '17, -3, 10**100', 'no'], ['float', '3.5, 1e-3', 'no'], ['complex', '2+3j', 'no'], ['bool', 'True, False', 'no'],
                ['str', "'hi', \"hi\"", 'no'], ['NoneType', 'None', 'no'], ['list', '[1, 2]', 'yes'], ['tuple', '(1, 2)', 'no'], ['dict', "{'k': 1}", 'yes'], ['set', '{1, 2}', 'yes']]))),
        cell({ title: 'type(), isinstance() and big integers', code: 'print(type(17), type(3.2), type("17"), type(True))\nprint(isinstance(True, int))   # bool is a kind of int\nprint(2 ** 100)                # ints never overflow\nprint(0.1 + 0.2)               # floats are approximate\nprint(round(0.1 + 0.2, 2))' }).el
    );
    inspect('3.14');
}

function operators(panel) {
    const list = h('ol', { class: 'expr-steps' });
    const result = h('div', { class: 'verdict is-ok' });
    const step = debounce(async (expr) => {
        try {
            const [steps, value] = await call('pybench.unit1_basics', 'evaluation_steps', expr);
            list.replaceChildren(...steps.map(s => h('li', {}, s)));
            result.className = 'verdict is-ok';
            result.textContent = `Result: ${JSON.stringify(value)}`;
        } catch (err) {
            list.replaceChildren();
            result.className = 'verdict is-bad';
            result.textContent = err.message;
        }
    }, 300);
    const input = field('Expression', '2 + 3 * 4 ** 2 // 5 - 1', { onInput: step, width: '100%' });
    const samples = h('div', { class: 'row' }, ['2 + 3 * 4 ** 2 // 5 - 1', '(2 + 3) * 4', '2 ** 3 ** 2', '-2 ** 2', '17 % 5 * 2', '10 - 4 - 3', 'not 3 > 2 or 5 % 2 == 1', '0 and 1 / 0'].map(v =>
        h('button', { class: 'btn btn--ghost btn--sm mono', type: 'button', onClick: () => { input.input.value = v; step(v); } }, v)));
    panel.append(
        head('Operators, operands and order of operations', 'Python follows PEMDAS: Parentheses, Exponent (**), unary minus, Multiplication / Division / Floor division / Modulus, Addition / Subtraction, then comparisons, not, and, or. Operators of the same level go left to right, except ** which goes right to left.'),
        h('div', { class: 'split' },
            card('Expression stepper', h('div', { class: 'stack' }, input.el, samples, list, result),
                h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'The expression is parsed with Python\'s ', ic('ast'), ' module and evaluated one operator at a time (', ic('evaluation_steps()'), '). Notice ', ic('0 and 1 / 0'), ' never divides: and stops early.')),
            card('Operator table', table(['Operator', 'Meaning', '17 ? 5'], [
                ['+', 'addition', '22'], ['-', 'subtraction', '12'], ['*', 'multiplication', '85'], ['/', 'true division', '3.4'],
                ['//', 'floor division', '3'], ['%', 'modulus (remainder)', '2'], ['**', 'exponent', '1419857'],
                ['== != < > <= >=', 'comparison', '17 > 5 → True'], ['and or not', 'logic', ''], ['+= -= *= ...', 'augmented assignment', 'x += 1']]))),
        cell({ title: 'Operators on numbers', code: 'a, b = 17, 5\nprint(a + b, a - b, a * b)\nprint(a / b, a // b, a % b, a ** 2)\nprint(-17 // 5, -17 % 5)   # floor goes down, remainder takes the sign of b\nx = 10\nx += 5\nx *= 2\nprint(x)' }).el
    );
    step(input.value);
}

function strings(panel) {
    const box = h('div', {});
    const update = debounce(() => pyInto(box, kv, 'pybench.unit1_basics', 'string_ops', a.value, b.value, Number(times.value) || 0));
    const a = field('a', 'Py', { onInput: update });
    const b = field('b', 'thon', { onInput: update });
    const times = field('times', '3', { type: 'number', width: '80px', onInput: update });
    panel.append(
        head('Operations on strings', 'Strings support + (concatenation) and * (repetition) with an int. You cannot add a string and a number without converting first: "Age: " + str(19).'),
        h('div', { class: 'split' },
            card('Try the operators', h('div', { class: 'row inputs-row' }, a.el, b.el, times.el), box),
            cell({ code: 'first = "Lovely"\nlast = "Professional"\nprint(first + " " + last + " University")\nprint("-" * 30)\nprint("ha" * 3)\nprint("Age: " + str(19))\nprint("Age: " + 19)   # TypeError' }).el)
    );
    update();
}

function comments(panel) {
    const SAMPLE = '# area of a circle\nimport math\n\nradius = float(input("Radius: "))  # read the radius\narea = math.pi * radius ** 2\n\n# composition: functions inside expressions inside a call\nprint("Area:", round(math.pi * float("2.5") ** 2, 2))\nprint("Area:", round(area, 2))';
    const stats = h('div', {});
    const c = cell({ title: 'Composition', code: SAMPLE, stdin: '3', onResult: () => pyInto(stats, kv, 'pybench.unit1_basics', 'count_comments', c.editor.value) });
    panel.append(
        head('Composition and comments', 'Composition means building bigger expressions out of smaller ones, like calling a function on the result of another. Comments start with # and are ignored by Python; they explain why the code does something.'),
        h('div', { class: 'split' }, c.el, card('This program has', stats,
            h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Counted by ', ic('count_comments()'), ' after each run.'))),
        cell({ title: 'Docstrings are not comments', code: 'def area(r):\n    """Return the area of a circle of radius r."""\n    return 3.14159 * r * r\n\nprint(area.__doc__)\nhelp(area)' }).el
    );
    pyInto(stats, kv, 'pybench.unit1_basics', 'count_comments', SAMPLE);
}
