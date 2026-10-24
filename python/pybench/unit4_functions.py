# Unit IV: functions and recursion

import math


# ---------- type conversion and coercion ----------

def convert(text):
    """Tries the usual conversions on a piece of text, like input() would give you."""
    results = {}
    for fn in (int, float, complex, bool, str, list):
        try:
            results[fn.__name__] = repr(fn(text))
        except ValueError as err:
            results[fn.__name__] = f"ValueError: {err}"
    return results


def coercion_examples():
    # Python widens the narrower type automatically in mixed arithmetic
    pairs = [(3, 2.5), (True, 4), (2, 3j), (7, 2)]
    out = []
    for a, b in pairs:
        out.append((f"{a!r} + {b!r}", repr(a + b), type(a + b).__name__))
    out.append(("7 / 2", repr(7 / 2), "float"))
    out.append(("7 // 2", repr(7 // 2), "int"))
    return out


# ---------- math functions ----------

def math_table(x):
    return {
        "math.sqrt(x)": math.sqrt(x) if x >= 0 else "ValueError (negative)",
        "math.floor(x)": math.floor(x), "math.ceil(x)": math.ceil(x),
        "math.factorial(int(x))": math.factorial(int(x)) if 0 <= x <= 20 else "too big",
        "math.log10(x)": round(math.log10(x), 6) if x > 0 else "ValueError",
        "math.sin(radians(x))": round(math.sin(math.radians(x)), 6),
        "math.gcd(int(x), 12)": math.gcd(int(x), 12),
        "math.pi * x": round(math.pi * x, 6),
    }


# ---------- adding new functions, parameters and arguments ----------

def area(length, width=None):
    # default parameter: one argument means a square
    if width is None:
        width = length
    return length * width


def describe_call(*args, **kwargs):
    # *args collects extra positional arguments, **kwargs the keyword ones
    return f"args={args} kwargs={kwargs}"


def bill(*items, tax=0.18, discount=0):
    subtotal = sum(items)
    return round((subtotal - discount) * (1 + tax), 2)


def scope_demo():
    total = 0

    def add(n):
        nonlocal total
        total += n
        return total

    add(5)
    add(7)
    return total


# ---------- recursion ----------

def factorial(n):
    if n < 0:
        raise ValueError("factorial is only defined for n >= 0")
    if n <= 1:
        return 1
    return n * factorial(n - 1)


def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


def fib_memo(n, memo=None):
    memo = {} if memo is None else memo
    if n < 2:
        return n
    if n not in memo:
        memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]


def power(base, exp):
    # fast exponent: halves the problem each call
    if exp == 0:
        return 1
    half = power(base, exp // 2)
    return half * half * (base if exp % 2 else 1)


def hanoi(n, src="A", aux="B", dst="C", moves=None):
    moves = [] if moves is None else moves
    if n:
        hanoi(n - 1, src, dst, aux, moves)
        moves.append((n, src, dst))
        hanoi(n - 1, aux, src, dst, moves)
    return moves


def digit_sum(n):
    return n if n < 10 else n % 10 + digit_sum(n // 10)


def call_tree(name, n):
    """Records the recursion tree of factorial / fib so the site can draw it.
    Each node is [label, result, children]."""
    def fact_node(k):
        if k <= 1:
            return [f"fact({k})", 1, []]
        child = fact_node(k - 1)
        return [f"fact({k})", k * child[1], [child]]

    def fib_node(k):
        if k < 2:
            return [f"fib({k})", k, []]
        a, b = fib_node(k - 1), fib_node(k - 2)
        return [f"fib({k})", a[1] + b[1], [a, b]]

    if name == "fib":
        return fib_node(min(n, 7))
    return fact_node(min(n, 10))


def count_calls(n):
    calls = 0

    def f(k):
        nonlocal calls
        calls += 1
        return k if k < 2 else f(k - 1) + f(k - 2)

    f(n)
    plain = calls
    calls = 0
    memo = {}

    def g(k):
        nonlocal calls
        calls += 1
        if k < 2:
            return k
        if k not in memo:
            memo[k] = g(k - 1) + g(k - 2)
        return memo[k]

    g(n)
    return plain, calls


if __name__ == "__main__":
    print(convert("42"))
    print(factorial(5), fib(10), power(2, 10), hanoi(3))
    print(count_calls(20))
