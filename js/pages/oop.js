import { h, card, table } from '../core/ui.js';
import { cell } from '../core/cell.js';
import { call, run } from '../core/py.js';
import { pageTabs, head, field, select, kv, tile, ic } from '../core/page.js';

export const intro = 'Classes bundle data (attributes) and behaviour (methods) together. This page builds classes and objects, then goes through the OOP terms in the syllabus: inheritance, overriding, data hiding and overloading, which together give encapsulation and polymorphism (CO5). Code: python/pybench/unit5_oop.py.';

export function render(page, { tab }) {
    return pageTabs(page, 'oop', [
        { id: 'classes', label: 'Classes & objects', render: classes },
        { id: 'attributes', label: 'Accessing attributes', render: attributes },
        { id: 'inheritance', label: 'Inheritance & overriding', render: inheritance },
        { id: 'hiding', label: 'Data hiding', render: hiding },
        { id: 'overloading', label: 'Overloading', render: overloading }
    ], tab);
}

const pyStr = (v) => JSON.stringify(String(v));
const out = () => h('pre', { class: 'cell__out', style: { borderRadius: '10px', border: '1px solid var(--line)' } });

function classes(panel) {
    const students = [['Riya', '12301', { INT108: 92, CSE111: 85 }], ['Aman', '12302', { INT108: 78 }]];
    const name = field('Name', 'Dev', { mono: false });
    const reg = field('Reg. no.', '12303', { width: '110px' });
    const mark = field('INT108 marks', '88', { type: 'number', width: '110px' });
    const result = out();
    async function refresh() {
        const code = `from pybench.unit5_oop import Student\nStudent.count = 0\nclass_list = [\n${students.map(([n, r, m]) => `    Student(${pyStr(n)}, ${pyStr(r)}, ${JSON.stringify(m)}),`).join('\n')}\n]\nfor s in class_list:\n    print(s)\nprint()\nprint("Student.count =", Student.count)\nprint("university (class attribute):", Student.university)\nprint("repr:", class_list)`;
        const r = await run(code);
        result.textContent = r.out + (r.error ?? '');
    }
    const add = h('button', { class: 'btn', type: 'button', onClick: () => {
        if (!name.value.trim()) return;
        students.push([name.value.trim(), reg.value.trim(), { INT108: Number(mark.value) || 0 }]);
        refresh();
    } }, 'Create object');
    panel.append(
        head('Creating classes and instance objects', 'class Student: defines a new type. Calling it, Student("Riya", "12301"), creates an instance and runs __init__, where self is the new object. Attributes set on self belong to that object; attributes in the class body are shared by every instance.'),
        h('div', { class: 'split' },
            card('Create Student objects', h('div', { class: 'row inputs-row' }, name.el, reg.el, mark.el, add), result,
                h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Each click runs the real ', ic('Student'), ' class from unit5_oop.py with your values; ', ic('__str__'), ' makes print() readable.')),
            card('class Student', h('div', { class: 'uml' }, h('div', { class: 'uml-box' }, h('b', {}, 'Student'),
                h('div', {}, 'university = "LPU"\ncount = 0'), h('div', {}, 'name\nreg_no\nmarks: dict'), h('div', {}, '__init__(name, reg_no, marks)\nadd_mark(subject, mark)\naverage()\n__str__(), __repr__()'))))),
        cell({ title: 'Your own class', code: 'class Point:\n    """A point in 2D."""\n\n    def __init__(self, x=0, y=0):\n        self.x = x\n        self.y = y\n\n    def distance_from_origin(self):\n        return (self.x ** 2 + self.y ** 2) ** 0.5\n\n    def __str__(self):\n        return f"({self.x}, {self.y})"\n\np = Point(3, 4)\nq = Point()\nprint(p, q, p.distance_from_origin())\nprint(type(p), isinstance(p, Point))\nprint(p is q, Point.__doc__)' }).el
    );
    refresh();
}

function attributes(panel) {
    const report = h('div', {});
    run('from pybench.unit5_oop import Student, attribute_report\nimport json\ns = Student("Riya", "12301", {"INT108": 92})\nprint(json.dumps(attribute_report(s), default=str))').then(r => {
        try { report.replaceChildren(kv(JSON.parse(r.out))); } catch { report.textContent = r.error || r.out; }
    });
    panel.append(
        head('Accessing attributes', 'Dot notation reads and writes attributes: obj.name. getattr / setattr / hasattr / delattr do the same with the name as a string, and vars(obj) shows an object\'s own attributes as a dictionary.'),
        h('div', { class: 'split' },
            card('attribute_report(Student("Riya", "12301", {...}))', report),
            cell({ title: 'Reading, adding and deleting attributes', code: 'class Phone:\n    brand = "generic"\n\n    def __init__(self, model):\n        self.model = model\n\np = Phone("X1")\nprint(p.model, p.brand)\np.price = 15999                 # new attribute on this object only\nprint(getattr(p, "price"), hasattr(p, "color"))\nsetattr(p, "color", "black")\nprint(vars(p))\ndel p.price\nprint(getattr(p, "price", "no price"))\nprint(Phone("Y2").brand, p.color)\nprint(Phone("Y2").color)   # AttributeError' }).el)
    );
}

function inheritance(panel) {
    const kind = select('Shape', [['Rectangle', 'Rectangle(w, h)'], ['Square', 'Square(side)'], ['Circle', 'Circle(r)'], ['Triangle', 'Triangle(a, b, c)']]);
    const args = field('Arguments', '3, 4', { width: '140px', onInput: () => build() });
    const DEFAULTS = { Rectangle: '3, 4', Square: '5', Circle: '2', Triangle: '3, 4, 5' };
    kind.input.addEventListener('change', () => { args.input.value = DEFAULTS[kind.value]; build(); });
    const result = h('div', {});
    async function build() {
        const r = await run(`from pybench.unit5_oop import *\nshape = ${kind.value}(${args.value})\nprint(shape.describe())\nprint("MRO:", " -> ".join(mro(type(shape))))\nprint("overrides area():", type(shape).area is not Shape.area)`);
        result.replaceChildren(h('pre', { class: 'cell__out', style: { borderRadius: '10px', border: '1px solid var(--line)' } }, r.out, r.error ? h('span', { class: 'out-err' }, r.error.trim().split('\n').pop()) : null));
    }
    const box = (name, attrs, methods, note) => h('div', { class: 'uml-box' }, h('b', {}, name), attrs ? h('div', {}, attrs) : null, h('div', {}, methods), note ? h('div', { style: { color: '#64748b' } }, note) : null);
    panel.append(
        head('Class inheritance and overriding methods', 'class Circle(Shape): makes Circle a child (subclass) of Shape. The child gets every method of the parent and can override any of them by defining a method with the same name. super() calls the parent\'s version. Code that only knows about Shape works for every child: that is polymorphism.'),
        card('Class hierarchy in unit5_oop.py',
            h('div', { class: 'uml', style: { alignItems: 'flex-start' } },
                box('Shape', 'name', 'area()  ← raises NotImplementedError\nperimeter()\ndescribe()'),
                h('span', { class: 'muted', style: { alignSelf: 'center', fontSize: '22px' } }, '◁'),
                box('Rectangle(Shape)', 'w, h', 'area()        overrides\nperimeter()   overrides'),
                box('Square(Rectangle)', null, '__init__(side)', 'multilevel: inherits area()'),
                box('Circle(Shape)', 'r', 'area()  perimeter()'),
                box('Triangle(Shape)', 'sides', 'area()  (Heron\'s formula)\ndescribe()  extends super()'))),
        h('div', { class: 'split' },
            card('Build a shape', h('div', { class: 'row inputs-row' }, kind.el, args.el), result),
            cell({ title: 'Polymorphism: one loop, many classes', code: 'from pybench.unit5_oop import Rectangle, Square, Circle, Triangle\n\nshapes = [Rectangle(3, 4), Square(2), Circle(1.5), Triangle(5, 5, 6)]\nfor s in shapes:\n    print(s.describe())     # each object runs its own area()\n\nbiggest = max(shapes, key=lambda s: s.area())\nprint("biggest:", biggest.name)\nprint(issubclass(Square, Rectangle), isinstance(shapes[1], Rectangle))' }).el),
        cell({ title: 'Write a subclass yourself', code: 'class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return "..."\n\n    def intro(self):\n        return f"{self.name} says {self.speak()}"\n\nclass Dog(Animal):\n    def speak(self):            # overriding\n        return "Woof"\n\nclass Puppy(Dog):\n    def speak(self):\n        return super().speak() + " (tiny)"\n\nfor a in (Animal("Generic"), Dog("Bruno"), Puppy("Coco")):\n    print(a.intro())' }).el
    );
    build();
}

function hiding(panel) {
    const history = [];
    const amount = field('Amount ₹', '500', { type: 'number', width: '110px' });
    const result = out();
    const log = h('ul', { class: 'steps mono', style: { fontSize: '12.5px' } });
    async function replay() {
        const code = `from pybench.unit5_oop import BankAccount\nacc = BankAccount("Lukshya", 1000)\n${history.map(([op, a]) => `try:\n    acc.${op}(${a})\nexcept ValueError as err:\n    print("${op}(${a}) refused:", err)`).join('\n')}\nprint("balance property:", acc.balance)\nprint("history:", acc._history)\nprint("vars(acc):", vars(acc))`;
        const r = await run(code);
        result.textContent = r.out + (r.error ?? '');
    }
    const act = (op) => h('button', { class: op === 'deposit' ? 'btn' : 'btn btn--ghost', type: 'button', onClick: () => { history.push([op, Number(amount.value) || 0]); replay(); } }, op);
    call('pybench.unit5_oop', 'hiding_demo').then(lines => log.replaceChildren(...lines.map(l => h('li', {}, l))));
    panel.append(
        head('Data hiding', 'Python has no private keyword. By convention _name means "internal, don\'t touch", and __name (two underscores) is name-mangled to _ClassName__name so it can\'t be reached by accident from outside. A read-only @property gives controlled access: the balance can only change through deposit() and withdraw(), which check the amount. This is encapsulation.'),
        h('div', { class: 'split' },
            card('BankAccount("Lukshya", 1000)', h('div', { class: 'row inputs-row' }, amount.el, act('deposit'), act('withdraw')), result,
                h('p', { class: 'muted', style: { fontSize: '12.5px' } }, 'Notice vars(acc) lists the hidden balance as ', ic('_BankAccount__balance'), '.')),
            card('hiding_demo() output', log)),
        cell({ title: 'Try to break in', code: 'from pybench.unit5_oop import BankAccount\nacc = BankAccount("Riya", 500)\nprint(acc.balance)\ntry:\n    acc.balance = 1_000_000\nexcept AttributeError as err:\n    print("blocked:", err)\nacc.__balance = 1_000_000     # creates a NEW attribute, the real one is untouched\nprint(acc.balance, acc.__balance)\nacc.withdraw(800)' }).el
    );
    replay();
}

function overloading(panel) {
    const v1 = field('v1', '3, 4', { width: '110px', onInput: () => calc() });
    const v2 = field('v2', '1, 2', { width: '110px', onInput: () => calc() });
    const k = field('k', '2', { type: 'number', width: '80px', onInput: () => calc() });
    const grid = h('div', { class: 'grid-3' });
    async function calc() {
        const r = await run(`from pybench.unit5_oop import Vector\na = Vector(${v1.value})\nb = Vector(${v2.value})\nfor label, value in [("a + b", a + b), ("a - b", a - b), ("a * k", a * ${Number(k.value) || 0}), ("k * a", ${Number(k.value) || 0} * a), ("a * b (dot)", a * b), ("abs(a)", round(abs(a), 3)), ("a == b", a == b), ("len(a)", len(a))]:\n    print(label + "|" + repr(value))`);
        if (r.error) { grid.replaceChildren(h('p', { class: 'note note--bad' }, r.error.trim().split('\n').pop())); return; }
        grid.replaceChildren(...r.out.trim().split('\n').map(line => { const [l, v] = line.split('|'); return tile(l, v); }));
    }
    panel.append(
        head('Function and operator overloading', 'In Java you can write two add() methods with different parameters. Python keeps only the last def with a name, so "overloading" is done with default and variable arguments (one method that accepts several call shapes) and with special methods: defining __add__ makes + work on your objects, __len__ makes len() work, and so on.'),
        card('Vector with operators: __add__, __sub__, __mul__, __rmul__, __eq__, __abs__, __len__', h('div', { class: 'row inputs-row' }, v1.el, v2.el, k.el), grid),
        h('div', { class: 'cell-grid' },
            cell({ title: 'Overloading with default / variable arguments', code: 'from pybench.unit5_oop import Calculator\nc = Calculator()\nprint(c.add(2, 3))\nprint(c.add(2, 3, 4, 5))\nprint(c.add(0.1, 0.2))\nprint(c.add(0.1, 0.2, rounding=2))\n\n# a second def with the same name replaces the first\ndef area(r):\n    return 3.14 * r * r\ndef area(l, w):\n    return l * w\nprint(area(3, 4))\nprint(area(3))   # TypeError: the 1-argument version is gone' }).el,
            cell({ title: 'Your own operator overloading', code: 'class Money:\n    def __init__(self, rupees):\n        self.rupees = rupees\n\n    def __add__(self, other):\n        return Money(self.rupees + other.rupees)\n\n    def __lt__(self, other):\n        return self.rupees < other.rupees\n\n    def __str__(self):\n        return f"₹{self.rupees:,}"\n\nwallet = [Money(500), Money(1200), Money(80)]\ntotal = wallet[0] + wallet[1] + wallet[2]\nprint(total)\nprint(min(wallet), max(wallet))\nprint(*sorted(wallet))' }).el)
    );
    calc();
}
