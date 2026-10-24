# PyBench

A Python workbench I made for **INT108 Python Programming** (LPU, session 2026-27). Every topic of the six units has a page with short notes, code you can edit and run, and small tools, plus all 15 lab practicals and a mini project, **MailGuard**.

**Live:** https://lushadowx.github.io/PyBench/

The Python on the site is real. It runs in the browser with [Pyodide](https://pyodide.org) (CPython 3.12 compiled to WebAssembly) inside a Web Worker, and it runs the same `.py` files that are in this repository. Nothing to install.

## What's inside

| Unit | Page | Highlights |
|---|---|---|
| I | Setting up Python, Variables & expressions | versions timeline, Windows install guide, name checker, type inspector, expression stepper (order of operations using `ast`) |
| II | Conditions & loops | modulus and clock, truth table generator, grade ladder, dice simulator, Monte Carlo π, loop tracer (`sys.settrace`), encapsulation → generalization |
| III | Strings, Lists/tuples/dicts | slice visualizer, hand-written `find`, word counter, clickable sparse matrix, aliasing vs copying, sets, stable sorting, bubble sort passes |
| IV | Functions & recursion | conversion tester, coercion table, `math` explorer, parameters calculator, recursion tree for `fib` / `factorial`, memoisation, Tower of Hanoi |
| V | Classes & objects | Student objects, attributes, Shape hierarchy with overriding and MRO, BankAccount data hiding, Vector operator overloading |
| VI | Files & exceptions, Regular expressions | text files, writing variables, directories, pickle with hex dump, try/except/else/finally flow, file explorer, regex tester, validation, web scraping with regex |
| Lab | 15 practicals, Lab record | every program from the practical list, runnable with your input, viva questions, printable lab record |
| Project | MailGuard | phishing mail analyser: 6 rule classes, scores with reasons, upload or paste your own mail |

There is also a Python shell (REPL) page and a **Course map** that links every syllabus topic and CO to the place it is covered.

## Run the Python locally

Only the standard library is used.

```bash
cd python
python -m pybench                      # menu: unit demos, practicals, MailGuard
python practicals/p03_armstrong.py     # any practical on its own
python -m pybench.mailguard            # analyse the sample phishing mails
python -m unittest discover -s tests -t .   # 46 tests
```

## Run the site locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Layout

```
index.html, css/, js/          the website (plain HTML, CSS and ES modules, no build step)
  js/core/py-worker.js         loads Pyodide in a worker and copies the python/ files into it
  js/core/cell.js              editable code cell with highlighting and an input box
  js/pages/                    one module per page
python/
  pybench/                     unit1_basics.py … unit6_files.py, mailguard.py, __main__.py
  practicals/                  p01 … p15
  data/                        story.txt, shop.html, 10 phishing + 4 normal mails
  tests/                       unittest tests
notebooks/mailguard_analysis.ipynb   MailGuard with pandas tables and matplotlib charts (Kaggle / Jupyter)
docs/PyBench_Report.pdf        project report
```

## Notes

- The sample mails are made up by me for testing; the brands in them are only there because real phishing mails pretend to be those brands.
- Files created on the site live in an in-memory file system and are gone after a reload.
- A program that runs longer than 10 seconds is stopped and Python restarts (there is no other way to interrupt Python in a worker without special server headers).

Lukshya Singh Supyal · B.Tech CSE
