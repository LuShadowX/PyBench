# Unit II: conditional and iterative statements

import io
import random
import sys
from contextlib import redirect_stdout
from itertools import product


# ---------- modulus operator ----------

def modulus_facts(a, b):
    """Everything % tells you about a and b."""
    return {
        "a % b": a % b,
        "a // b": a // b,
        "check": f"{b} * {a // b} + {a % b} = {b * (a // b) + a % b}",
        "a is even": a % 2 == 0,
        "last digit of a": abs(a) % 10,
        "b divides a": a % b == 0,
    }


def clock_after(hour, hours_later):
    # a 12 hour clock wraps around, which is exactly what % does
    h = (hour + hours_later) % 12
    return 12 if h == 0 else h


# ---------- Boolean expressions and logic operators ----------

def truth_table(expression, names=("a", "b")):
    """Rows of a truth table for an expression written with and / or / not."""
    code = compile(expression, "<expr>", "eval")
    for name in code.co_names:
        if name not in names:
            raise NameError(f"use only {', '.join(names)} in the expression, not {name}")
    rows = []
    for values in product([False, True], repeat=len(names)):
        scope = dict(zip(names, values))
        rows.append((*values, bool(eval(code, {"__builtins__": {}}, scope))))
    return rows


# ---------- conditional and nested conditionals ----------

def grade(marks):
    # chained conditional (if / elif / else)
    if not 0 <= marks <= 100:
        return "invalid"
    if marks >= 90:
        return "O"
    elif marks >= 80:
        return "A+"
    elif marks >= 70:
        return "A"
    elif marks >= 60:
        return "B+"
    elif marks >= 50:
        return "B"
    elif marks >= 40:
        return "C"
    else:
        return "F"


def ticket_price(age, student, weekend):
    # nested conditionals: the inner decision only happens after the outer one
    if age < 5:
        price = 0
    else:
        if age >= 60:
            price = 100
        else:
            if student:
                price = 120
            else:
                price = 200
        if weekend:
            price += 50
    return price


def leap_year(year):
    if year % 4 == 0:
        if year % 100 == 0:
            return year % 400 == 0
        return True
    return False


# ---------- random numbers ----------

def roll_dice(times, seed=None):
    rng = random.Random(seed)
    return [rng.randint(1, 6) for _ in range(times)]


def frequency(rolls):
    counts = {face: 0 for face in range(1, 7)}
    for r in rolls:
        counts[r] += 1
    return counts


def guess_game(secret, guesses):
    """Plays the number guessing game with a list of guesses (so it runs without input())."""
    log = []
    tries = 0
    while tries < len(guesses):
        g = guesses[tries]
        tries += 1
        if g == secret:
            log.append(f"{g}: correct in {tries} tries")
            break
        log.append(f"{g}: too {'low' if g < secret else 'high'}")
    else:
        log.append(f"out of guesses, it was {secret}")
    return log


def estimate_pi(points, seed=1):
    # random numbers inside a loop: Monte Carlo estimate of pi
    rng = random.Random(seed)
    inside = 0
    for _ in range(points):
        x, y = rng.random(), rng.random()
        if x * x + y * y <= 1:
            inside += 1
    return 4 * inside / points


# ---------- while, for, nested loops ----------

def collatz(n):
    steps = [n]
    while n != 1:
        n = n // 2 if n % 2 == 0 else 3 * n + 1
        steps.append(n)
    return steps


def pattern(rows, kind="triangle"):
    lines = []
    for i in range(1, rows + 1):
        if kind == "triangle":
            line = ""
            for j in range(i):
                line += "* "
        elif kind == "pyramid":
            line = " " * (rows - i) + "* " * i
        elif kind == "numbers":
            line = " ".join(str(j) for j in range(1, i + 1))
        else:
            line = "".join(chr(65 + j) for j in range(i))
        lines.append(line.rstrip())
    return "\n".join(lines)


def primes_upto(limit):
    # nested while: the inner loop tries divisors for each number
    found = []
    n = 2
    while n <= limit:
        d = 2
        while d * d <= n and n % d:
            d += 1
        if d * d > n:
            found.append(n)
        n += 1
    return found


# ---------- encapsulation and generalization ----------
# Step 1 prints one row of 2s, step 2 wraps it in a function (encapsulation),
# step 3 takes n as a parameter (generalization), step 4 reuses it for a whole table.

def print_multiples(n, high=6):
    return "  ".join(f"{n * i:3}" for i in range(1, high + 1))


def mult_table(high=6):
    return "\n".join(print_multiples(i, high) for i in range(1, high + 1))


# ---------- loop tracer ----------

def trace(source, max_steps=200):
    """Runs a small program and records every line executed with the variables
    at that moment (and what was printed so far). The loop tracer on the site uses it."""
    steps = []
    code = compile(source, "<tracer>", "exec")
    printed = io.StringIO()

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "<tracer>":
            return tracer
        if event == "line":
            names = {k: v for k, v in frame.f_locals.items() if not k.startswith("__") and isinstance(v, (int, float, str, bool, list, tuple))}
            steps.append((frame.f_lineno, {k: repr(v) for k, v in names.items()}, printed.getvalue()))
            if len(steps) >= max_steps:
                raise RuntimeError(f"stopped after {max_steps} steps (infinite loop?)")
        return tracer

    scope = {"__builtins__": __builtins__}
    sys.settrace(tracer)
    try:
        with redirect_stdout(printed):
            exec(code, scope)
    finally:
        sys.settrace(None)
    steps.append((None, steps[-1][1] if steps else {}, printed.getvalue()))
    return steps


if __name__ == "__main__":
    print(truth_table("a and not b"))
    print(pattern(4, "pyramid"))
    print(mult_table(4))
