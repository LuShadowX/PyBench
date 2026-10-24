import { h, card, table } from '../core/ui.js';
import { cell, codeView } from '../core/cell.js';
import { call, run, source } from '../core/py.js';
import { pageTabs, head, field, select, kv, debounce, pyRepr, ic } from '../core/page.js';

export const intro = 'A regular expression is a small pattern language for text: "a 10 digit number starting with 6 to 9", "anything that looks like an e-mail". Python\'s re module matches, searches, extracts and replaces with them. The last tab scrapes a web page using nothing but regular expressions (CO6). Code: python/pybench/unit6_files.py.';

export function render(page, { tab }) {
    return pageTabs(page, 'regex', [
        { id: 'concept', label: 'Concept & syntax', render: concept },
        { id: 'tester', label: 'Regex tester', render: tester },
        { id: 'match', label: 'match, search & validation', render: matching },
        { id: 'types', label: 'Groups, sub & split', render: types },
        { id: 'scrape', label: 'Web scraping', render: scraping }
    ], tab);
}

const CHEATS = [
    ['.', 'any character except newline'], ['\\d', 'a digit 0-9'], ['\\w', 'letter, digit or _'], ['\\s', 'whitespace'],
    ['\\D \\W \\S', 'NOT digit / word / space'], ['[aeiou]', 'one of these'], ['[^0-9]', 'anything but these'], ['[A-Za-z]', 'a range'],
    ['^', 'start of string (or line with M)'], ['$', 'end of string'], ['\\b', 'word boundary'], ['*', '0 or more'],
    ['+', '1 or more'], ['?', '0 or 1 (optional)'], ['{3}', 'exactly 3'], ['{2,5}', '2 to 5'],
    ['a|b', 'a or b'], ['( )', 'group, captured'], ['(?: )', 'group, not captured'], ['(?P<name> )', 'named group'],
    ['*?  +?', 'lazy (as few as possible)'], ['\\.', 'a literal dot'], ['(?=...)', 'lookahead'], ['r"..."', 'raw string, keeps \\ as is']
];

function concept(panel) {
    panel.append(
        head('Concept of regular expressions', 'A pattern is a string where some characters have special meaning (metacharacters). Write patterns as raw strings, r"\\d+", so Python doesn\'t treat the backslashes itself. re.compile() builds a pattern object once if you use it many times.'),
        card('Metacharacters', table(['Pattern', 'Means'], CHEATS)),
        h('div', { class: 'cell-grid' },
            cell({ title: 'First patterns', code: 'import re\ntext = "Call 9876543210 or 01822-404404 before 5 pm"\nprint(re.findall(r"\\d", text)[:5])\nprint(re.findall(r"\\d+", text))\nprint(re.findall(r"\\d{10}", text))\nprint(re.findall(r"\\b\\w{4}\\b", text))\nprint(re.search(r"\\d+ pm", text).group())' }).el,
            cell({ title: 'Raw strings and compile', code: 'import re\nprint("\\\\d", r"\\d", len("\\n"), len(r"\\n"))\nphone = re.compile(r"[6-9]\\d{9}")\nfor s in ["9988776655", "1234567890", "my no. 7012345678"]:\n    m = phone.search(s)\n    print(s, "->", m.group() if m else None)' }).el)
    );
}

function tester(panel) {
    const pat = field('Pattern', '', { width: '100%' });
    const flags = { I: h('input', { type: 'checkbox' }), M: h('input', { type: 'checkbox' }), S: h('input', { type: 'checkbox' }) };
    const text = h('textarea', { class: 'input mono', rows: 5 });
    text.value = 'Contact riya.k@lpu.in or aman_23@gmail.com.\nCall +91 9876543210 or 8123456789.\nExam on 24-10-2026, results 15/11/2026.\nFee Rs. 1,500 and ₹2,499.00 paid from 192.168.1.10\nReg no 12301234, roll 7';
    const shown = h('div', { class: 'rx-text' });
    const details = h('div', {});
    const presets = h('div', { class: 'rx-cheats' });
    const update = debounce(async () => {
        const f = (flags.I.checked ? 2 : 0) | (flags.M.checked ? 8 : 0) | (flags.S.checked ? 16 : 0);
        try {
            const r = await call('pybench.unit6_files', 'regex_report', pat.value, text.value, f);
            let html = '';
            let last = 0;
            const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
            for (const [a, b] of r.spans) { if (b > a) { html += esc(text.value.slice(last, a)) + `<mark>${esc(text.value.slice(a, b))}</mark>`; last = b; } }
            shown.innerHTML = html + esc(text.value.slice(last));
            details.replaceChildren(kv({ 'matches': String(r.spans.length), 'match() at the start': r['match (start only)'], 'search() first anywhere': r['search (first anywhere)'], 'findall()': pyRepr(r.findall), 'groups in pattern': String(r['groups in pattern']) }),
                r.spans.length ? table(['#', 'span', 'group()', 'groups()'], r.spans.slice(0, 12).map(([a, b, g, gs], i) => [String(i + 1), `${a}–${b}`, g, pyRepr(gs)])) : null);
        } catch (err) {
            shown.textContent = text.value;
            details.replaceChildren(h('p', { class: 'note note--bad' }, err.message));
        }
    });
    pat.input.addEventListener('input', update);
    text.addEventListener('input', update);
    Object.values(flags).forEach(c => c.addEventListener('change', update));
    run('import json\nfrom pybench.unit6_files import PATTERNS\nprint(json.dumps(PATTERNS))').then(r => {
        const all = JSON.parse(r.out);
        presets.replaceChildren(...Object.entries(all).map(([name, p]) => h('button', { type: 'button', onClick: () => { pat.input.value = p; update(); } }, h('b', {}, name), h('span', { class: 'mono', style: { fontSize: '11px', color: '#64748b', wordBreak: 'break-all' } }, p))));
        pat.input.value = all.email;
        update();
    });
    panel.append(
        head('Regex tester', 'Type a pattern and see every match in the text, highlighted. It calls regex_report(), which runs re.match, re.search, re.findall and re.finditer with the same pattern so you can compare them.'),
        card('Patterns from unit6_files.PATTERNS (click one)', presets),
        h('div', { class: 'split' },
            card('Pattern and text', pat.el,
                h('div', { class: 'row', style: { margin: '8px 0' } }, ...Object.entries({ I: 'IGNORECASE', M: 'MULTILINE', S: 'DOTALL' }).map(([k, label]) => h('label', { class: 'row mono', style: { fontSize: '12px' } }, flags[k], `re.${label}`))),
                text, h('h4', {}, 'Matches'), shown),
            card('What re found', details))
    );
}

function matching(panel) {
    const kind = select('Check', [['username', 'username'], ['password', 'password'], ['pin code', 'pin code'], ['email', 'email']], { onChange: () => check() });
    const value = field('Value', 'lukshya_05', { width: '220px', onInput: () => check() });
    const verdict = h('div', { class: 'verdict' });
    const RULES = { username: 'starts with a lowercase letter, then 2–15 lowercase letters, digits or _', password: 'at least 8 characters with an uppercase, a lowercase, a digit and a symbol (lookaheads)', 'pin code': '6 digits, not starting with 0', email: 'name@domain.tld' };
    const rule = h('p', { class: 'muted', style: { fontSize: '12.5px' } });
    async function check() {
        const ok = await call('pybench.unit6_files', 'validate', kind.value, value.value);
        verdict.className = `verdict ${ok ? 'is-ok' : 'is-bad'}`;
        verdict.textContent = `${ok ? '✓ valid' : '✗ not valid'} ${kind.value}: "${value.value}"`;
        rule.textContent = `Rule: ${RULES[kind.value]}. Uses re.fullmatch().`;
    }
    kind.input.addEventListener('change', () => { value.input.value = { username: 'lukshya_05', password: 'Int108@lpu', 'pin code': '144411', email: 'student@lpu.in' }[kind.value]; check(); });
    panel.append(
        head('Using the match function', 're.match() only matches at the start of the string, re.search() finds the first match anywhere, re.fullmatch() needs the whole string to match, which is what validation needs. They return a Match object (with group(), start(), end(), span()) or None.'),
        h('div', { class: 'split' },
            card('Form validation with fullmatch()', h('div', { class: 'row inputs-row' }, kind.el, value.el), verdict, rule),
            cell({ title: 'match vs search vs fullmatch', code: 'import re\ns = "INT108 Python"\nprint(re.match(r"\\d+", s))          # None: s starts with INT\nprint(re.search(r"\\d+", s))         # finds 108\nprint(re.match(r"[A-Z]+", s).group())\nm = re.search(r"(\\d)(\\d+)", s)\nprint(m.group(), m.group(1), m.group(2), m.span())\nprint(re.fullmatch(r"\\d{6}", "144411"), re.fullmatch(r"\\d{6}", "1444110"))' }).el),
        cell({ title: 'Checking user input in a loop', code: 'import re\nwhile True:\n    mobile = input("Mobile number: ")\n    if re.fullmatch(r"[6-9]\\d{9}", mobile):\n        print("saved", mobile)\n        break\n    print("not a valid 10 digit Indian mobile number, try again")', stdin: '12345\n98765432100\n9876543210' }).el
    );
    check();
}

function types(panel) {
    panel.append(
        head('Various types of regular expressions', 'Beyond plain matching: groups pull out parts of a match, named groups give them names, greedy vs lazy quantifiers change how much is taken, re.sub() replaces and re.split() splits on a pattern.'),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Groups and named groups', code: 'import re\ndate = re.compile(r"(?P<day>\\d{2})-(?P<month>\\d{2})-(?P<year>\\d{4})")\nm = date.search("Result declared on 15-11-2026")\nprint(m.groups())\nprint(m.group("year"), m["month"])\nprint(m.groupdict())\nprint(re.findall(r"(\\w+)@(\\w+)\\.in", "a@lpu.in, b@abc.in"))' }).el,
            cell({ title: 'Greedy vs lazy', code: 'import re\nhtml = "<b>bold</b> and <i>italic</i>"\nprint(re.findall(r"<.*>", html))    # greedy: takes everything\nprint(re.findall(r"<.*?>", html))   # lazy: as little as possible\nprint(re.findall(r"<(\\w+)>", html))' }).el,
            cell({ title: 're.sub: search and replace', code: 'import re\ntext = "Call 9876543210 or 8123456789"\nprint(re.sub(r"\\d{6}(\\d{4})", r"XXXXXX\\1", text))   # mask numbers\nprint(re.sub(r"\\s+", " ", "too    many   spaces"))\nprint(re.sub(r"(\\w+)@(\\w+)", lambda m: m.group(1).upper() + " at " + m.group(2), "riya@lpu"))\nprint(re.subn(r"a", "4", "banana"))' }).el,
            cell({ title: 're.split and flags', code: 'import re\nprint(re.split(r"[,;\\s]+", "a, b;c  d,e"))\nprint(re.findall(r"^\\w+", "one\\ntwo\\nthree", re.M))\nprint(re.findall(r"python", "Python PYTHON python", re.I))\nprint(re.findall(r"a.c", "a\\nc abc", re.S))' }).el)
    );
}

function scraping(panel) {
    const frame = h('iframe', { class: 'shop-frame', title: 'Sample shop page', src: 'python/data/shop.html', loading: 'lazy' });
    const result = h('div', {});
    const products = h('div', {});
    const sortBy = select('Sort products by', [['price', 'price (low → high)'], ['rating', 'rating (high → low)'], ['name', 'name']], { onChange: () => scrape() });
    const target = select('Page to scrape', [['python/data/shop.html', 'sample shop page'], ['index.html', 'this site\'s own index.html']], { onChange: () => scrape() });
    async function scrape() {
        const html = await (await fetch(target.value)).text();
        const r = await call('pybench.unit6_files', 'scrape', html);
        result.replaceChildren(kv({ title: r.title, headings: r.headings.join(' · ') || '—', 'links (href, text)': r.links.slice(0, 8).map(([u, t]) => `${u} (${t.replace(/<[^>]+>/g, '').trim()})`).join(', ') || '—', prices: r.prices.join(', ') || '—', emails: r.emails.join(', ') || '—' }));
        const rows = await call('pybench.unit6_files', 'scrape_products', html);
        const key = sortBy.value;
        rows.sort((a, b) => (key === 'price' ? a[1] - b[1] : key === 'rating' ? b[2] - a[2] : a[0].localeCompare(b[0])));
        products.replaceChildren(rows.length ? table(['Product', 'Price (₹)', 'Rating'], rows.map(([n, p, s]) => [n, p.toLocaleString('en-IN'), s.toFixed(1)])) : h('p', { class: 'muted' }, 'No product cards on this page.'));
    }
    const code = h('div', {});
    source('pybench/unit6_files.py').then(src => {
        const lines = src.split('\n');
        const start = lines.findIndex(l => l.startsWith('def scrape('));
        const end = lines.findIndex(l => l.startsWith('if __name__'));
        code.replaceChildren(codeView(lines.slice(start, end).join('\n').trimEnd(), { start: start + 1 }));
    });
    panel.append(
        head('Web scraping by using regular expressions', 'Scraping means pulling data out of a web page\'s HTML. For a simple, known page, regular expressions are enough: find the title, every <a href>, prices, e-mails, and each product card. (For messy real sites a proper HTML parser like BeautifulSoup is safer, regex breaks when the layout changes.)'),
        h('div', { class: 'grid-2' },
            card('The page (python/data/shop.html)', frame),
            card('scrape() result', h('div', { class: 'row inputs-row' }, target.el), result)),
        h('div', { class: 'grid-2' },
            card('scrape_products(): one tuple per product card', sortBy.el, products),
            card('The scraping code', code)),
        cell({ title: 'Scrape it yourself', code: 'import re\nhtml = open("/home/pyodide/app/data/shop.html", encoding="utf-8").read()\n\nnames = re.findall(r"<h3>(.*?)</h3>", html)\nprices = [int(p.replace(",", "")) for p in re.findall(r"₹ ([\\d,]+)", html)]\nfor name, price in sorted(zip(names, prices), key=lambda x: x[1]):\n    print(f"{name:<25} ₹{price:>6,}")\nprint("average price:", round(sum(prices) / len(prices)))' }).el
    );
    scrape();
}
