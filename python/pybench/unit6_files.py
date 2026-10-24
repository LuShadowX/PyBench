# Unit VI: files and exceptions, regular expressions

import os
import pickle
import re


# ---------- text files: writing, reading, writing variables ----------

def write_notes(path, lines):
    with open(path, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")
    return os.path.getsize(path)


def append_line(path, line):
    with open(path, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def read_three_ways(path):
    with open(path, encoding="utf-8") as f:
        whole = f.read()
    with open(path, encoding="utf-8") as f:
        first = f.readline()
        rest = f.readlines()
    return {"read()": whole, "readline()": first, "readlines() after that": rest}


def save_variables(path, **values):
    # a text file only stores strings, so numbers are converted with str() / f-strings
    with open(path, "w", encoding="utf-8") as f:
        for name, value in values.items():
            f.write(f"{name}={value}\n")


def load_variables(path):
    values = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            name, _, text = line.rstrip("\n").partition("=")
            try:
                values[name] = int(text)
            except ValueError:
                try:
                    values[name] = float(text)
                except ValueError:
                    values[name] = text
    return values


# ---------- directories ----------

def tree(path=".", depth=0, limit=3):
    lines = []
    for name in sorted(os.listdir(path)):
        full = os.path.join(path, name)
        if os.path.isdir(full):
            lines.append("    " * depth + name + "/")
            if depth + 1 < limit:
                lines.extend(tree(full, depth + 1, limit))
        else:
            lines.append("    " * depth + f"{name} ({os.path.getsize(full)} B)")
    return lines


def make_dirs(base):
    for sub in ("notes", "data/raw", "data/clean"):
        os.makedirs(os.path.join(base, sub), exist_ok=True)
    return tree(base)


# ---------- pickling ----------

def pickle_roundtrip(obj, path):
    with open(path, "wb") as f:
        pickle.dump(obj, f)
    with open(path, "rb") as f:
        back = pickle.load(f)
    with open(path, "rb") as f:
        raw = f.read()
    return back, raw


# ---------- exceptions ----------

def safe_divide(a, b):
    """try / except / else / finally, returning the path the code took."""
    path = ["try"]
    try:
        result = a / b
    except ZeroDivisionError:
        path.append("except ZeroDivisionError")
        result = None
    except TypeError:
        path.append("except TypeError")
        result = None
    else:
        path.append("else (no exception)")
    finally:
        path.append("finally (always runs)")
    return result, path


def read_or_explain(path):
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        return f"Sorry, the file {path} does not exist."
    else:
        words = len(text.split())
        return f"{path} has about {words} words."


def word_counts(paths):
    # the textbook "count words in many books, skip missing ones" exercise
    report = {}
    for path in paths:
        try:
            with open(path, encoding="utf-8") as f:
                report[path] = len(f.read().split())
        except FileNotFoundError:
            report[path] = None
    return report


# ---------- regular expressions ----------

PATTERNS = {
    "email": r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+",
    "url": r"https?://[^\s\"'<>]+",
    "indian mobile": r"(?:\+91[- ]?)?[6-9]\d{9}\b",
    "date dd-mm-yyyy": r"\b(\d{2})[-/](\d{2})[-/](\d{4})\b",
    "price in rupees": r"(?:Rs\.?|₹)\s?\d[\d,]*(?:\.\d{2})?",
    "IPv4 address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "capital words": r"\b[A-Z][a-z]+\b",
    "LPU reg. no.": r"\b1\d{7}\b",
}


def regex_report(pattern, text, flags=0):
    """match vs search vs findall vs finditer for one pattern."""
    rx = re.compile(pattern, flags)
    m = rx.match(text)
    s = rx.search(text)
    return {
        "match (start only)": m.group() if m else None,
        "search (first anywhere)": s.group() if s else None,
        "findall": rx.findall(text),
        "spans": [(x.start(), x.end(), x.group(), x.groups()) for x in rx.finditer(text)],
        "groups in pattern": rx.groups,
    }


def validate(kind, value):
    # fullmatch so the whole value has to fit, not just a part of it
    rules = {
        "username": r"[a-z][a-z0-9_]{2,15}",
        "password": r"(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s]).{8,}",
        "pin code": r"[1-9]\d{5}",
        "email": PATTERNS["email"],
    }
    return re.fullmatch(rules[kind], value) is not None


# ---------- web scraping with regular expressions ----------

def scrape(html):
    """Pulls the title, headings, links, prices and emails out of an HTML page
    with plain regular expressions (fine for simple pages, a real parser is safer)."""
    title = re.search(r"<title>(.*?)</title>", html, re.S | re.I)
    return {
        "title": title.group(1).strip() if title else None,
        "headings": [re.sub(r"<[^>]+>", "", h).strip() for h in re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", html, re.S | re.I)],
        "links": re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.S | re.I),
        "prices": re.findall(PATTERNS["price in rupees"], html),
        "emails": sorted(set(re.findall(PATTERNS["email"], html))),
    }


def scrape_products(html):
    """Each product card on the sample shop page becomes a (name, price, rating) tuple."""
    rx = re.compile(r'<div class="product">.*?<h3>(.*?)</h3>.*?₹\s?([\d,]+).*?data-rating="([\d.]+)"', re.S)
    return [(name, int(price.replace(",", "")), float(rating)) for name, price, rating in rx.findall(html)]


if __name__ == "__main__":
    print(safe_divide(10, 0), safe_divide(10, 4))
    print(read_or_explain("missing.txt"))
    print(regex_report(PATTERNS["date dd-mm-yyyy"], "Exam on 24-10-2026, result 15/11/2026"))
