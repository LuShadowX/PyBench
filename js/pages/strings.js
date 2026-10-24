import { h, card, table } from '../core/ui.js';
import { cell } from '../core/cell.js';
import { call } from '../core/py.js';
import { pageTabs, head, field, debounce, ic } from '../core/page.js';

export const intro = 'A string is a compound data type: a sequence of characters you can index, measure, walk through, slice, compare and search. Strings are immutable, every "change" builds a new string. Tools here use python/pybench/unit3_data.py.';

export function render(page, { tab }) {
    return pageTabs(page, 'strings', [
        { id: 'basics', label: 'Compound type & length', render: basics },
        { id: 'slices', label: 'Traversal & slices', render: slices },
        { id: 'compare', label: 'Comparison', render: compare },
        { id: 'find', label: 'find, looping & counting', render: find },
        { id: 'methods', label: 'String methods', render: methods }
    ], tab);
}

function boxes(text, on = [], first) {
    return h('div', { class: 'str-boxes' }, [...text].map((ch, i) => h('div', { class: `str-box${on.includes(i) ? ' is-on' : ''}${i === first ? ' is-first' : ''}` },
        h('small', {}, String(i)), h('b', {}, ch === ' ' ? '␣' : ch), h('small', { class: 'neg' }, String(i - text.length)))));
}

function basics(panel) {
    panel.append(
        head('A string is a compound data type', 'Made of smaller pieces (characters) that you can reach by index. Indexes start at 0; negative indexes count from the end, so s[-1] is the last character. len(s) gives the number of characters, and the last valid index is len(s) - 1.'),
        card('Indexes of "PYTHON"', boxes('PYTHON'), h('p', { class: 'muted', style: { fontSize: '12.5px', margin: 0 } }, 'Top row: positive index. Bottom row: negative index.')),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Indexing and length', code: 'fruit = "banana"\nprint(fruit[0], fruit[1], fruit[-1])\nprint(len(fruit))\nprint(fruit[len(fruit) - 1])\nprint(fruit[6])   # IndexError: the last index is 5' }).el,
            cell({ title: 'Strings are immutable', code: 'greeting = "Hello, world!"\n# greeting[0] = "J"   would be a TypeError\nnew = "J" + greeting[1:]\nprint(new)\nprint(greeting)   # unchanged\nprint(id(greeting) != id(new))' }).el)
    );
}

function slices(panel) {
    const viz = h('div', {});
    const info = h('div', { class: 'verdict is-ok mono' });
    const update = debounce(async () => {
        const n = (v) => (v.value.trim() === '' ? null : Number(v.value));
        try {
            const r = await call('pybench.unit3_data', 'slice_info', text.value, n(start), n(stop), n(step));
            viz.replaceChildren(boxes(text.value, r.indices, r.indices[0]));
            const part = (v) => (v.value.trim() === '' ? '' : v.value);
            info.className = 'verdict is-ok mono';
            info.textContent = `s[${part(start)}:${part(stop)}${step.value.trim() ? ':' + step.value : ''}] = '${r.result}'   indices ${JSON.stringify(r.indices)}`;
        } catch (err) { info.className = 'verdict is-bad mono'; info.textContent = err.message; }
    });
    const text = field('s', 'LOVELY PROFESSIONAL', { onInput: update, width: '260px' });
    const start = field('start', '0', { onInput: update, width: '80px' });
    const stop = field('stop', '6', { onInput: update, width: '80px' });
    const step = field('step', '', { onInput: update, width: '80px' });
    const presets = h('div', { class: 'row' }, [['0', '6', ''], ['7', '', ''], ['', '', '-1'], ['', '', '2'], ['-12', '', ''], ['1', '-1', ''], ['', '', '-2']].map(([a, b, c]) =>
        h('button', { class: 'btn btn--ghost btn--sm mono', type: 'button', onClick: () => { start.input.value = a; stop.input.value = b; step.input.value = c; update(); } }, `s[${a}:${b}${c ? ':' + c : ''}]`)));
    panel.append(
        head('String traversal and slices', 's[start:stop:step] takes the characters from start up to but not including stop. Leave start out to begin at the start, leave stop out to go to the end. A negative step walks backwards, s[::-1] reverses.'),
        card('Slice visualizer', h('div', { class: 'row inputs-row' }, text.el, start.el, stop.el, step.el), presets, viz, info),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Traversal with while', code: 'word = "Python"\nindex = 0\nwhile index < len(word):\n    print(index, word[index])\n    index += 1' }).el,
            cell({ title: 'Traversal with for', code: 'for ch in "Python":\n    print(ch, end=" ")\nprint()\n\n# with the index too\nfor i, ch in enumerate("Python"):\n    print(i, ch, end=" | ")\n\nprefixes = "JKLMNOPQ"\nfor letter in prefixes:\n    print(letter + "ack", end=" ")' }).el,
            cell({ title: 'Slices', code: 's = "Monty Python"\nprint(s[0:5])\nprint(s[6:])\nprint(s[:5] + "!")\nprint(s[::-1])\nprint(s[::2])\nprint(s[3:3] == "")   # empty slice' }).el)
    );
    update();
}

function compare(panel) {
    const out = h('div', { class: 'verdict is-ok mono' });
    const update = debounce(async () => { out.textContent = await call('pybench.unit3_data', 'compare', a.value, b.value); });
    const a = field('a', 'apple', { onInput: update });
    const b = field('b', 'Apple', { onInput: update });
    const presets = h('div', { class: 'row' }, [['apple', 'Apple'], ['banana', 'band'], ['zebra', 'apple'], ['cat', 'category'], ['10', '9'], ['same', 'same']].map(([x, y]) =>
        h('button', { class: 'btn btn--ghost btn--sm mono', type: 'button', onClick: () => { a.input.value = x; b.input.value = y; update(); } }, `${x} vs ${y}`)));
    panel.append(
        head('String comparison', 'Comparison operators work on strings too. == checks equality; < and > compare character by character using Unicode code points (ord), so all uppercase letters come before lowercase ones and "10" < "9".'),
        h('div', { class: 'split' },
            card('Why is one string smaller?', h('div', { class: 'row inputs-row' }, a.el, b.el), presets, out),
            card('Code points', table(['char', 'ord()'], [['"0" – "9"', '48 – 57'], ['"A" – "Z"', '65 – 90'], ['"a" – "z"', '97 – 122'], ['" " (space)', '32']]))),
        cell({ title: 'Case-insensitive comparison', code: 'word = "Banana"\nif word < "banana":\n    print(word, "comes before banana")\nprint(word.lower() == "banana")\nprint(sorted(["pear", "Apple", "banana"]))\nprint(sorted(["pear", "Apple", "banana"], key=str.lower))' }).el
    );
    update();
}

function find(panel) {
    const viz = h('div', {});
    const out = h('div', { class: 'grid-3' });
    const update = debounce(async () => {
        const ch = letter.value.slice(0, 1);
        if (!ch) return;
        const [idx, count] = await Promise.all([call('pybench.unit3_data', 'find', text.value, ch, Number(from.value) || 0), call('pybench.unit3_data', 'count_letter', text.value, ch)]);
        const all = [...text.value].map((c, i) => (c === ch ? i : -1)).filter(i => i >= 0);
        viz.replaceChildren(boxes(text.value, all, idx));
        out.replaceChildren(
            h('div', { class: 'stat' }, h('span', {}, `find(s, "${ch}", ${Number(from.value) || 0})`), h('b', { class: 'mono' }, String(idx))),
            h('div', { class: 'stat' }, h('span', {}, `count_letter(s, "${ch}")`), h('b', { class: 'mono' }, String(count))),
            h('div', { class: 'stat' }, h('span', {}, 'built-in check'), h('b', { class: 'mono' }, `${text.value.indexOf(ch, Number(from.value) || 0)} / ${all.length}`)));
    });
    const text = field('s', 'banana bandana', { onInput: update, width: '240px' });
    const letter = field('letter', 'a', { onInput: update, width: '70px' });
    const from = field('start', '0', { type: 'number', onInput: update, width: '80px' });
    panel.append(
        head('A find function, looping and counting', 'The textbook writes its own find(): walk the string with a while loop and return the index of the first match, or -1. Counting uses the counter pattern: start at 0, add 1 each time the condition holds.'),
        card('find() and count_letter() from unit3_data.py', h('div', { class: 'row inputs-row' }, text.el, letter.el, from.el), viz, out,
            h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'The blue outline is the first match after start. The "built-in check" column is ', ic('str.find()'), ' and ', ic('str.count()'), ' giving the same answers.')),
        h('div', { class: 'cell-grid' },
            cell({ title: 'find, written by hand', code: 'def find(text, ch, start=0):\n    index = start\n    while index < len(text):\n        if text[index] == ch:\n            return index\n        index += 1\n    return -1\n\nprint(find("banana", "n"))\nprint(find("banana", "n", 3))\nprint(find("banana", "z"))\nprint("banana".find("nan"))   # the built-in also finds substrings' }).el,
            cell({ title: 'Looping and counting', code: 'text = input("Enter a sentence: ")\nvowels = 0\nwords = 1\nfor ch in text:\n    if ch.lower() in "aeiou":\n        vowels += 1\n    elif ch == " ":\n        words += 1\nprint("vowels:", vowels)\nprint("words:", words)', stdin: 'Python makes looping and counting easy' }).el)
    );
    update();
}

function methods(panel) {
    panel.append(
        head('String methods', 'Methods are functions that belong to the string: s.upper(), s.split(), s.replace(). They always return a new string (or list), the original is not changed.'),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Case and cleaning', code: 's = "  Lovely Professional University  "\nprint(s.strip())\nprint(s.lower(), s.upper(), sep="|")\nprint(s.strip().title())\nprint(s.strip().swapcase())\nprint("python".capitalize())\nprint(s.count("o"))' }).el,
            cell({ title: 'Searching and testing', code: 's = "INT108 Python Programming"\nprint(s.startswith("INT"), s.endswith("ing"))\nprint(s.find("Python"), s.index("P"))\nprint("108" in s)\nprint("abc123".isalnum(), "123".isdigit(), "abc".isalpha())\nprint("   ".isspace(), "Hello".istitle())' }).el,
            cell({ title: 'Split, join and replace', code: 'csv = "Aman,Riya,Dev,Kavya"\nnames = csv.split(",")\nprint(names)\nprint(" | ".join(names))\nprint(csv.replace(",", " and "))\nprint("a-b-c".split("-", 1))\nprint("one two  three".split())' }).el,
            cell({ title: 'Formatting', code: 'name, marks, cgpa = "Riya", 92, 8.765\nprint(f"{name} scored {marks} with CGPA {cgpa:.2f}")\nprint(f"{name:<10}|{marks:>5}|")\nprint("{} scored {}".format(name, marks))\nprint("%s scored %d" % (name, marks))\nprint(f"{0.25:.0%}", f"{1234567:,}")' }).el)
    );
}
