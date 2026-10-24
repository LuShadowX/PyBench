import { h, card, table, toast } from '../core/ui.js';
import { cell, codeView } from '../core/cell.js';
import { run, fs, source, WORK } from '../core/py.js';
import { bars, tile, ic } from '../core/page.js';

export const intro = 'MailGuard is the mini project of this course. It reads e-mails from text files, runs them through six rule classes and gives each mail a phishing score from 0 to 100 with the reasons. It started from practical 14 (most common words in ten phishing mails) and grew into something that uses every unit: strings and dictionaries, functions, classes with inheritance and overriding, files, pickle, exceptions and a lot of regular expressions.';

const ANALYSE = (folders) => `import json, os
from pybench.mailguard import MailGuard, Mail, load_mails
guard = MailGuard()
mails = []
for label, folder in ${JSON.stringify(folders)}:
    if not os.path.isdir(folder):
        continue
    for name in sorted(os.listdir(folder)):
        try:
            mail = Mail.from_file(os.path.join(folder, name))
        except (OSError, UnicodeDecodeError) as err:
            print(json.dumps({"error": f"{name}: {err}"}))
            continue
        r = guard.analyse(mail)
        mails.append({"set": label, "name": name, "subject": mail.subject, "sender": mail.sender, "date": mail.headers.get("date", ""),
                      "score": r.score, "verdict": r.verdict, "findings": [(f.rule, f.points, f.detail) for f in r.findings],
                      "body": mail.body, "urls": mail.urls})
words = guard.common_words(load_mails("/home/pyodide/app/data/phishing"), 12)
print(json.dumps({"mails": mails, "words": words, "rules": guard.rules}))`;

const FOLDERS = [['phishing', '/home/pyodide/app/data/phishing'], ['normal', '/home/pyodide/app/data/safe'], ['yours', `${WORK}/inbox`]];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const vclass = (v) => (v === 'phishing' ? 'v-phishing' : v === 'suspicious' ? 'v-suspicious' : 'v-safe');

export function render(page) {
    let data = null;
    let selected = null;
    let filter = 'all';
    const stats = h('div', { class: 'grid-4' });
    const list = h('div', { class: 'mail-list' });
    const view = h('div', {});
    const words = h('div', {});
    const seg = h('div', { class: 'seg' }, [['all', 'All'], ['phishing', 'Phishing set'], ['normal', 'Normal set'], ['yours', 'Yours']].map(([k, label]) =>
        h('button', { type: 'button', 'aria-pressed': k === filter, onClick: (e) => { filter = k; [...seg.children].forEach(b => b.setAttribute('aria-pressed', b === e.target)); drawList(); } }, label)));

    async function analyse() {
        list.replaceChildren(h('p', { class: 'muted' }, 'Analysing…'));
        const r = await run(ANALYSE(FOLDERS), { timeout: 20000 });
        if (r.error) { list.replaceChildren(h('pre', { class: 'cell__out has-error' }, r.error)); return; }
        data = JSON.parse(r.out.trim().split('\n').pop());
        const phish = data.mails.filter(m => m.set === 'phishing');
        const normal = data.mails.filter(m => m.set === 'normal');
        stats.replaceChildren(
            tile('Mails analysed', String(data.mails.length), `${phish.length} phishing · ${normal.length} normal · ${data.mails.length - phish.length - normal.length} yours`),
            tile('Phishing caught', `${phish.filter(m => m.verdict === 'phishing').length} / ${phish.length}`, 'score ≥ 50'),
            tile('False alarms', `${normal.filter(m => m.verdict !== 'looks safe').length} / ${normal.length}`, 'normal mails flagged'),
            tile('Rule classes', String(data.rules.length), 'subclasses of Rule'));
        words.replaceChildren(bars(data.words, { color: '#ef4444' }));
        if (!selected || !data.mails.some(m => m.name === selected)) selected = data.mails.sort((a, b) => b.score - a.score)[0]?.name;
        drawList();
    }

    function drawList() {
        const mails = data.mails.filter(m => filter === 'all' || m.set === filter).sort((a, b) => b.score - a.score);
        list.replaceChildren(...(mails.length ? mails.map(m => h('button', { type: 'button', class: `mail-item${m.name === selected ? ' is-on' : ''}`, onClick: () => { selected = m.name; drawList(); } },
            h('b', { class: `score ${vclass(m.verdict)}` }, String(m.score)),
            h('div', {}, h('span', {}, m.subject || '(no subject)'), h('small', {}, `${m.sender || 'unknown sender'} · ${m.set}`)))) : [h('p', { class: 'muted' }, filter === 'yours' ? 'Upload or paste a mail to test it.' : 'Nothing here.')]));
        drawMail(data.mails.find(m => m.name === selected));
    }

    function drawMail(m) {
        if (!m) { view.replaceChildren(); return; }
        // highlight what the rules complained about
        let body = esc(m.body);
        const marks = new Set();
        m.findings.forEach(([, , d]) => { const q = d.match(/'([^']+)'/); if (q) marks.add(q[1]); });
        m.urls.forEach(u => marks.add(u));
        ['password', 'otp', 'cvv', 'card number', 'bank details', 'aadhaar', 'pan card', 'kyc', 'login details', 'credentials', 'lottery', 'prize', 'refund', 'claim', 'bitcoin'].forEach(w => marks.add(w));
        [...marks].sort((a, b) => b.length - a.length).forEach(w => {
            const rx = new RegExp(`(?<![\\w>])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\w<])`, 'gi');
            body = body.replace(rx, '<mark>$1</mark>');
        });
        view.replaceChildren(
            h('div', { class: 'mail-view' },
                h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '8px' } },
                    h('span', { class: `badge ${m.verdict === 'phishing' ? 'badge--bad' : m.verdict === 'suspicious' ? 'badge--warn' : 'badge--good'}`, style: { fontSize: '13px' } }, `${m.verdict.toUpperCase()} · ${m.score} / 100`),
                    h('span', { class: 'mono muted', style: { fontSize: '12px' } }, m.name)),
                h('div', { class: 'gauge' }, h('i', { style: { '--v': `${Math.min(99, m.score)}%` } })),
                h('p', { class: 'hdr', style: { marginTop: '12px' } }, [`From: ${m.sender}`, `Subject: ${m.subject}`, m.date && `Date: ${m.date}`].filter(Boolean).flatMap((l, i) => [i ? h('br') : null, l])),
                h('p', { class: 'bodytext', html: body })),
            card(`Why (${m.findings.length} findings)`, m.findings.length ? h('ul', { class: 'findings' }, m.findings.map(([rule, pts, detail]) => h('li', {}, h('b', {}, `+${pts}`), h('div', {}, detail, h('small', {}, rule))))) : h('p', { class: 'muted' }, 'No rule fired. This mail looks safe.')));
    }

    // add your own mail
    const paste = h('textarea', { class: 'input mono', rows: 7, placeholder: 'From: Someone <a@b.com>\nSubject: ...\n\nbody text' });
    paste.value = 'From: HDFC Bank <alerts@hdfc-verify-login.com>\nSubject: Your account is blocked\n\nDear customer, your net banking is blocked. Verify now with your OTP and card number at http://hdfc-verify-login.com/secure\n';
    const upload = h('input', { type: 'file', accept: '.txt,.eml', multiple: true, class: 'sr-only', id: 'mg-upload' });
    upload.addEventListener('change', async () => {
        for (const file of upload.files) await fs.write(`${WORK}/inbox/${file.name.replace(/[^\w.-]/g, '_')}`, await file.text());
        toast(`${upload.files.length} file(s) added`);
        filter = 'yours';
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.textContent === 'Yours'));
        selected = null;
        await analyse();
    });
    async function addPasted() {
        const name = `pasted_${Date.now() % 100000}.txt`;
        await fs.write(`${WORK}/inbox/${name}`, paste.value);
        selected = name;
        filter = 'yours';
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.textContent === 'Yours'));
        await analyse();
    }

    const rulesCode = h('div', {});
    source('pybench/mailguard.py').then(src => {
        const lines = src.split('\n');
        const a = lines.findIndex(l => l.startsWith('class Rule:'));
        const b = lines.findIndex(l => l.startsWith('class CredentialRule'));
        rulesCode.replaceChildren(codeView(lines.slice(a, b).join('\n').trimEnd(), { start: a + 1 }));
    });

    page.append(
        stats,
        h('div', { class: 'row', style: { margin: '16px 0 10px' } }, seg,
            h('label', { class: 'btn btn--ghost btn--sm', for: 'mg-upload' }, '⬆ Upload .txt / .eml'), upload,
            h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onClick: analyse }, '↻ Re-analyse')),
        h('div', { class: 'mg' }, list, view),
        h('div', { class: 'grid-2', style: { marginTop: '16px' } },
            card('Paste a mail to test', paste, h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn', type: 'button', onClick: addPasted }, 'Analyse this mail')),
                h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'It is saved to /home/pyodide/work/inbox and analysed by the same code. Headers are optional.')),
            card('Most common words in the 10 phishing mails (practical 14)', words, h('p', { class: 'muted', style: { fontSize: '12.5px' } }, ic('MailGuard.common_words()'), ' uses ', ic('collections.Counter'), ' after removing stop words.'))),
        card('How it is built',
            table(['Part', 'What it does', 'Syllabus'], [
                ['Mail', 'parses headers with a regex (re.M), gives sender_domain, urls, words() as properties; Mail.from_file() is a classmethod', 'Unit III strings, Unit V classes, Unit VI regex'],
                ['Rule (base) + 6 subclasses', 'UrgencyRule, CredentialRule, LinkRule, SenderRule, MoneyRule, AttachmentRule each override check(mail)', 'Unit V inheritance, overriding, polymorphism'],
                ['Finding / Report', 'one finding per reason with points; Report sums them (max 100), verdict property, __lt__ so reports sort', 'Unit V operator overloading, Unit III sorting'],
                ['MailGuard', 'keeps the rules in a name-mangled __rules list (data hiding), analyse(), analyse_folder() with try/except for bad files', 'Unit V data hiding, Unit VI exceptions, files, directories'],
                ['save() / load()', 'pickles the reports to a binary file and reads them back, FileNotFoundError gives []', 'Unit VI pickling'],
                ['common_words()', 'Counter of words minus stop words', 'Unit III dictionaries, practical 14']])),
        h('p', { class: 'note' }, 'There is also a notebook version with tables and charts (pandas + matplotlib), ready for Kaggle or Jupyter: ',
            h('a', { href: 'https://github.com/LuShadowX/PyBench/blob/main/notebooks/mailguard_analysis.ipynb', target: '_blank', rel: 'noopener' }, 'notebooks/mailguard_analysis.ipynb'), '.'),
        h('div', { class: 'grid-2', style: { marginTop: '14px' } },
            card('The Rule base class and the first rule', rulesCode),
            cell({ title: 'Use MailGuard from code (and add your own rule)', code: 'from pybench.mailguard import MailGuard, Mail, Rule, UrgencyRule\n\nclass ShoutingRule(Rule):          # a new rule is just a subclass\n    name = "subject in capitals"\n    weight = 12\n\n    def check(self, mail):\n        return [self.hit("SHOUTING subject")] if mail.subject.isupper() else []\n\nguard = MailGuard([UrgencyRule(), ShoutingRule()])\nmail = Mail("From: x@y.com\\nSubject: ACT NOW\\n\\nYour account expires immediately")\nreport = guard.analyse(mail)\nprint(report, report.findings)\n\nfull = MailGuard()\nreports, errors = full.analyse_folder("/home/pyodide/app/data/phishing")\nMailGuard.save(reports, "reports.pkl")\nprint(len(MailGuard.load("reports.pkl")), "reports saved and loaded with pickle")' }).el)
    );
    analyse();
}
