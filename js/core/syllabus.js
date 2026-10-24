// INT108 Python Programming (session 2026-27), topic by topic, with where each one lives in PyBench.
// [topic, page/tab, what you can do there]

export const UNITS = [
    ['I', 'Setting up your programming environment; variables, expressions and statements', [
        ['Python versions', 'setup/versions', 'Timeline 0.9 → 3.14, Python 2 vs 3 table, live sys.version of the running interpreter'],
        ['Python on Windows', 'setup/windows', 'Install steps, installer screen with "Add python.exe to PATH", Command Prompt checks, troubleshooting table'],
        ["Running a 'Hello World' program", 'setup/hello', 'Interactive vs script mode, runnable Hello World and a first input() program'],
        ['Naming and using variables', 'basics/names', 'Live name checker (identifier rules, keywords, built-ins, PEP 8), assignment cell'],
        ['Avoiding NameError when using variables', 'basics/names', 'NameError cell to read and fix; name_error_demo() explains the error'],
        ['Values and types', 'basics/types', 'Type inspector: type, id and mutability of any literal; type() / isinstance() cell'],
        ['Variable names and keywords', 'basics/names', 'All keywords listed from keyword.kwlist of the running Python'],
        ['Statements', 'basics/names', 'Assignment, chained and multiple assignment statements'],
        ['Operators and operands', 'basics/operators', 'Operator table with 17 ? 5, arithmetic and augmented assignment cell'],
        ['Order of operations', 'basics/operators', 'Expression stepper: evaluates any expression one operator at a time using ast (PEMDAS, ** right to left, short-circuit)'],
        ['Operations on string', 'basics/strings', '+ and * on strings with live inputs, str + int TypeError'],
        ['Composition and comments', 'basics/comments', 'Composition cell, comment counter (count_comments), docstrings vs comments']
    ]],
    ['II', 'Conditional and iterative statements', [
        ['Modulus operator', 'control/modulus', 'a % b explorer (even, last digit, divisibility, check), clock arithmetic drawing'],
        ['Random numbers', 'control/random', 'Dice simulator with seed and histogram, random module cell'],
        ['Boolean expressions', 'control/boolean', 'Truth table generator for any expression in a, b, c'],
        ['Logic operators', 'control/boolean', 'and / or / not table, truthiness and short-circuit cell'],
        ['Conditional', 'control/conditionals', 'Grade calculator showing which if / elif / else branch runs'],
        ['Nested conditionals', 'control/conditionals', 'Ticket price (three levels of nesting), leap year, positive/even cell'],
        ['while statements', 'control/loops', 'Collatz while loop; loop tracer steps through while loops'],
        ['for loop statement', 'control/loops', 'range(), strings, step; break / continue / loop else'],
        ['Nested for', 'control/loops', 'Multiplication grid; pattern printer (triangle, pyramid, numbers, letters)'],
        ['Nested while', 'control/loops', 'Prime finder with an inner while'],
        ['Random numbers in loops', 'control/random', 'Monte Carlo π, guess the number game, coin toss loop'],
        ['Encapsulation and generalization', 'control/general', 'The multiplication table built in four steps: code → function → parameter → table'],
        ['Tracing loops (extra)', 'control/tracer', 'Loop tracer built on sys.settrace: line by line, variables and output']
    ]],
    ['III', 'Strings, lists, tuples and dictionaries', [
        ['String: a compound data type', 'strings/basics', 'Index boxes with positive and negative indexes, immutability cell'],
        ['Length', 'strings/basics', 'len() and the last index, IndexError'],
        ['String traversal', 'strings/slices', 'while and for traversal, enumerate'],
        ['String slices', 'strings/slices', 'Slice visualizer: any s[start:stop:step] highlighted on the characters'],
        ['Comparison', 'strings/compare', 'Explains why one string is smaller using ord() of the first different character'],
        ['find function', 'strings/find', 'Hand-written find() with start position, compared with str.find'],
        ['Looping and counting', 'strings/find', 'count_letter() counter pattern, vowels and words counter'],
        ['List values, length, membership', 'collections/lists', 'list_demo() on your own values: len, in, indexing'],
        ['List operations, slices', 'collections/lists', '+, *, slices, slice assignment, list methods'],
        ['Deletion', 'collections/lists', 'del by index and slice, remove(), clear()'],
        ['Accessing elements; list and for loops', 'collections/lists', 'for over items and indexes, list comprehensions'],
        ['List parameters', 'collections/lists', 'double_all() changes the caller\'s list, doubled() returns a new one'],
        ['Nested list', 'collections/nested', 'Matrix builder and transpose, marks table'],
        ['Mutability and tuples', 'collections/tuples', 'TypeError when assigning to a tuple item, single-element tuple'],
        ['Tuple assignment', 'collections/tuples', 'Unpacking, swap, starred assignment'],
        ['Tuple as return values', 'collections/tuples', 'min_max_avg() returning three values, divmod()'],
        ['Dictionaries operations and methods', 'collections/dicts', 'Word counter with bar chart, keys/values/items/get/setdefault/pop'],
        ['Sparse matrices', 'collections/sparse', 'Clickable grid stored by the SparseMatrix class as {(row, col): value}'],
        ['Aliasing and copying', 'collections/aliasing', 'aliasing_demo(): alias vs shallow vs deep copy, is vs =='],
        ['Sets and sorting the data (CO4)', 'collections/sets', 'Set operations, sorting records with key=, bubble sort pass by pass']
    ]],
    ['IV', 'Functions and recursion', [
        ['Function calls', 'functions/calls', 'Built-in calls, conversion tester'],
        ['Type conversion and coercion', 'functions/calls', 'convert() tries int/float/complex/bool/str/list, coercion table'],
        ['Math functions', 'functions/math', 'math_table(x) with a slider, math module cell'],
        ['Adding new function', 'functions/define', 'def / return, functions calling functions, scope, lambda'],
        ['Parameters and argument', 'functions/params', 'bill(*items, tax=, discount=) calculator, defaults, keyword, *args, **kwargs, mutable default trap'],
        ['Recursion', 'functions/recursion', 'Recursion tree drawn for fib(n) and factorial(n), call counts with and without memo'],
        ['Recursion and its use', 'functions/uses', 'Tower of Hanoi moves, fast power, digit sum, binary search, flatten']
    ]],
    ['V', 'Classes and objects; object oriented programming terminology', [
        ['Creating classes', 'oop/classes', 'Student class with class and instance attributes, class diagram'],
        ['Creating instance objects', 'oop/classes', 'Create Student objects from a form, __str__ and __repr__'],
        ['Accessing attributes', 'oop/attributes', 'attribute_report(): vars, class attributes, methods; getattr / setattr / hasattr / del'],
        ['Class inheritance', 'oop/inheritance', 'Shape → Rectangle → Square, Circle, Triangle; MRO; build any shape'],
        ['Overriding methods', 'oop/inheritance', 'area() and perimeter() overridden, describe() extended with super(), Animal/Dog/Puppy'],
        ['Data hiding', 'oop/hiding', 'BankAccount with name-mangled __balance and read-only property, deposit / withdraw'],
        ['Function overloading', 'oop/overloading', 'Vector operator overloading (+ - * == abs len), Calculator.add(*nums, rounding=)']
    ]],
    ['VI', 'Files and exceptions; regular expressions', [
        ['Text files', 'files/text', 'open modes, write / append, file object attributes'],
        ['Writing variables', 'files/variables', 'save_variables() / load_variables() and by-hand conversion'],
        ['Reading from a file', 'files/text', 'read(), readline(), readlines(), line by line'],
        ['Writing to a file', 'files/text', 'Write what you type with input() into diary.txt'],
        ['Directories', 'files/dirs', 'os.getcwd, listdir, makedirs, rename, walk, rmtree; file explorer'],
        ['Pickling', 'files/pickle', 'Pickle any value and see the bytes as a hex dump, pickle Student objects'],
        ['Handling the ZeroDivisionError exception', 'files/exceptions', 'safe_divide() flow showing which of try / except / else / finally run'],
        ['Using try-except blocks', 'files/exceptions', 'Multiple except clauses, failing silently with pass, raise'],
        ['The else block', 'files/exceptions', 'else runs only without an exception (flow highlight and cells)'],
        ['Handling the FileNotFoundError exception', 'files/exceptions', 'read_or_explain(path) and the multiple-files cell'],
        ['Concept of regular expression', 'regex/concept', 'Metacharacter table, raw strings, compile'],
        ['Various types of regular expressions', 'regex/types', 'Groups, named groups, greedy vs lazy, sub, split, flags'],
        ['Using match function', 'regex/match', 'match vs search vs fullmatch, form validation, input loop'],
        ['Web scraping by using regular expressions', 'regex/scrape', 'scrape() and scrape_products() on a sample shop page and on this site itself']
    ]]
];

export const COS = [
    ['CO1', 'describe the installation of python environment and basics of Python language', ['setup', 'basics', 'shell'], 'Setting up Python, Variables & expressions, Python shell, practical 1'],
    ['CO2', 'apply the conditional and iterative statements for evaluating the appropriate alternates', ['control'], 'Conditions & loops (7 tabs incl. loop tracer), practicals 2–5 and 12'],
    ['CO3', 'explore functions, including recursion, with parameters and arguments in Python', ['functions'], 'Functions & recursion (recursion tree, parameters calculator), practical 7'],
    ['CO4', 'construct the core data structures like lists, dictionaries, tuples and sets in Python to store, process and sort the data', ['strings', 'collections'], 'Strings, Lists/tuples/dicts/sets/sorting, practicals 6, 13, 14'],
    ['CO5', 'apply the concepts of Object-oriented programming as used in Python using encapsulation, polymorphism, and inheritance', ['oop', 'mailguard'], 'Classes & objects (5 tabs), Stack class (practical 13), MailGuard rule classes'],
    ['CO6', 'examine file handling operations and effectively apply regular expressions for pattern matching', ['files', 'regex', 'mailguard'], 'Files & exceptions, Regular expressions, practicals 8–11, 14, 15, MailGuard']
];
