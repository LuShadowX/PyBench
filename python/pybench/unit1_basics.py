# Unit I: setting up the environment, variables, expressions and statements

import ast
import builtins
import keyword
import math
import platform
import sys


def hello():
    print("Hello, World!")


def environment():
    """What Python am I running on? Same info `python --version` gives, plus a bit more."""
    v = sys.version_info
    return {
        "version": f"{v.major}.{v.minor}.{v.micro}",
        "implementation": platform.python_implementation(),
        "platform": sys.platform,
        "executable": sys.executable or "(browser build, no executable)",
        "keywords": len(keyword.kwlist),
    }


# ---------- naming and using variables ----------

def check_name(name):
    """Tells if a string can be used as a variable name and why not if it can't."""
    if not name:
        return False, "a name can't be empty"
    if keyword.iskeyword(name):
        return False, f"'{name}' is a Python keyword"
    if name[0].isdigit():
        return False, "a name can't start with a digit"
    if not name.isidentifier():
        bad = [c for c in name if not (c.isalnum() or c == "_")]
        return False, f"'{bad[0]}' is not allowed in a name" if bad else "not a valid identifier"
    if hasattr(builtins, name):
        return True, f"valid, but it hides the built-in {name}()"
    if name != name.lower() and not name.isupper():
        return True, "valid, but Python style (PEP 8) uses lower_case_with_underscores"
    return True, "valid name"


def name_error_demo(source):
    """Runs a small snippet and explains a NameError instead of crashing."""
    scope = {}
    try:
        exec(source, scope)
    except NameError as err:
        missing = str(err).split("'")[1] if "'" in str(err) else "?"
        return f"NameError: {err}. Assign {missing} before using it (and check the spelling)."
    return "no NameError, every name was defined before use"


# ---------- values and types ----------

def describe(value):
    return {"value": repr(value), "type": type(value).__name__, "id": id(value), "mutable": not isinstance(value, (int, float, complex, str, bool, tuple, frozenset, bytes, type(None)))}


def literal_type(text):
    """Type of a literal typed by the user, without running arbitrary code."""
    try:
        return describe(ast.literal_eval(text))
    except (ValueError, SyntaxError):
        return {"value": repr(text), "type": "str (not a literal, read as text)", "id": id(text), "mutable": False}


# ---------- operators and order of operations ----------

OPS = {
    ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/", ast.FloorDiv: "//", ast.Mod: "%", ast.Pow: "**",
    ast.USub: "-", ast.UAdd: "+", ast.Not: "not ", ast.And: "and", ast.Or: "or",
    ast.Lt: "<", ast.Gt: ">", ast.LtE: "<=", ast.GtE: ">=", ast.Eq: "==", ast.NotEq: "!=",
}


def evaluation_steps(expression):
    """Evaluates an arithmetic expression one operator at a time, in the order
    Python does it (PEMDAS + left-to-right, ** right-to-left). Returns the steps."""
    tree = ast.parse(expression, mode="eval")
    steps = []

    def walk(node):
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.BinOp):
            left = walk(node.left)
            right = walk(node.right)
            result = eval(f"{left!r} {OPS[type(node.op)]} {right!r}")
            steps.append(f"{left!r} {OPS[type(node.op)]} {right!r} = {result!r}")
            return result
        if isinstance(node, ast.UnaryOp):
            operand = walk(node.operand)
            result = eval(f"{OPS[type(node.op)]}{operand!r}")
            steps.append(f"{OPS[type(node.op)]}{operand!r} = {result!r}")
            return result
        if isinstance(node, ast.BoolOp):
            value = walk(node.values[0])
            word = OPS[type(node.op)]
            for nxt in node.values[1:]:
                if (word == "and" and not value) or (word == "or" and value):
                    steps.append(f"{value!r} {word} ... = {value!r} (short-circuit, right side never runs)")
                    return value
                right = walk(nxt)
                result = (value and right) if word == "and" else (value or right)
                steps.append(f"{value!r} {word} {right!r} = {result!r}")
                value = result
            return value
        if isinstance(node, ast.Compare):
            left = walk(node.left)
            result = True
            for op, comp in zip(node.ops, node.comparators):
                right = walk(comp)
                ok = eval(f"{left!r} {OPS[type(op)]} {right!r}")
                steps.append(f"{left!r} {OPS[type(op)]} {right!r} = {ok!r}")
                result = result and ok
                left = right
            return result
        raise ValueError("only numbers, operators and brackets please")

    result = walk(tree.body)
    return steps, result


# ---------- operations on strings, composition, comments ----------

def string_ops(a, b, times=3):
    return {
        "a + b": a + b,
        f"a * {times}": a * times,
        "len(a)": len(a),
        "a.upper()": a.upper(),
        "b.title()": b.title(),
        "a in b": a in b,
        "f-string": f"{a} and {b}",
    }


def circle_area(text):
    # composition: the result of one call feeds the next, all in one statement
    return round(math.pi * float(text.strip()) ** 2, 2)


def count_comments(source):
    """Counts full-line comments, inline comments and code lines in a program."""
    full = inline = code = 0
    for line in source.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            full += 1
        elif "#" in stripped and not ("'" in stripped or '"' in stripped):
            inline += 1
            code += 1
        else:
            code += 1
    return {"comment lines": full, "inline comments": inline, "code lines": code}


if __name__ == "__main__":
    hello()
    print(environment())
    print(evaluation_steps("2 + 3 * 4 ** 2 // 5"))
