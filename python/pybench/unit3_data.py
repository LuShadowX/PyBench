# Unit III: strings, lists, tuples, dictionaries (and sets, from CO4)

import copy


# ---------- strings ----------

def traverse(word):
    """String traversal with a while loop and with for, both give the same characters."""
    by_index = []
    i = 0
    while i < len(word):
        by_index.append((i, i - len(word), word[i]))
        i += 1
    return by_index


def slice_info(text, start=None, stop=None, step=None):
    """What text[start:stop:step] picks, with the actual indices it visits."""
    picked = range(len(text))[slice(start, stop, step)]
    return {"result": text[start:stop:step], "indices": list(picked)}


def find(text, ch, start=0):
    # the textbook find function, written by hand
    index = start
    while index < len(text):
        if text[index] == ch:
            return index
        index += 1
    return -1


def count_letter(text, ch):
    # looping and counting
    count = 0
    for c in text:
        if c == ch:
            count += 1
    return count


def compare(a, b):
    # strings compare character by character using their Unicode code points
    if a == b:
        return f"'{a}' == '{b}'"
    for x, y in zip(a, b):
        if x != y:
            sign = "<" if x < y else ">"
            return f"'{a}' {sign} '{b}' because '{x}' ({ord(x)}) {sign} '{y}' ({ord(y)})"
    shorter, longer = (a, b) if len(a) < len(b) else (b, a)
    return f"'{shorter}' < '{longer}' because it is a prefix of it"


# ---------- lists ----------

def list_demo(values):
    nums = list(values)
    out = {
        "list": nums,
        "len": len(nums),
        "first, last": (nums[0], nums[-1]) if nums else None,
        "slice [1:3]": nums[1:3],
        "3 in list": 3 in nums,
        "list + [99]": nums + [99],
        "list * 2": nums * 2,
    }
    trimmed = nums[:]
    if trimmed:
        del trimmed[0]
    out["after del [0]"] = trimmed
    return out


def double_all(items):
    # list parameter: the function changes the caller's list (lists are mutable)
    for i in range(len(items)):
        items[i] *= 2


def doubled(items):
    # this one builds a new list and leaves the original alone
    return [x * 2 for x in items]


def matrix(rows, cols):
    # nested list
    return [[r * cols + c + 1 for c in range(cols)] for r in range(rows)]


def transpose(m):
    return [[m[r][c] for r in range(len(m))] for c in range(len(m[0]))]


# ---------- tuples ----------

def swap(a, b):
    a, b = b, a  # tuple assignment
    return a, b


def min_max_avg(nums):
    # tuple as return value
    return min(nums), max(nums), sum(nums) / len(nums)


def tuple_is_immutable():
    point = (3, 4)
    try:
        point[0] = 10
    except TypeError as err:
        return f"TypeError: {err}"


# ---------- dictionaries ----------

def word_count(text):
    counts = {}
    for word in text.lower().split():
        word = word.strip(".,!?;:\"'()")
        if word:
            counts[word] = counts.get(word, 0) + 1
    return counts


def dict_methods(d):
    d = dict(d)
    log = [f"keys() -> {list(d.keys())}", f"values() -> {list(d.values())}", f"items() -> {list(d.items())}"]
    log.append(f"get('zzz', 0) -> {d.get('zzz', 0)}")
    d.setdefault("new", 1)
    log.append(f"setdefault('new', 1) -> {d}")
    popped = d.pop("new")
    log.append(f"pop('new') -> {popped}, now {d}")
    return log


class SparseMatrix:
    """A matrix that stores only non-zero cells in a dict keyed by (row, col)."""

    def __init__(self, rows, cols):
        self.rows, self.cols = rows, cols
        self.cells = {}

    def __setitem__(self, pos, value):
        if value:
            self.cells[pos] = value
        else:
            self.cells.pop(pos, None)

    def __getitem__(self, pos):
        return self.cells.get(pos, 0)

    def dense(self):
        return [[self[r, c] for c in range(self.cols)] for r in range(self.rows)]

    def saving(self):
        total = self.rows * self.cols
        return f"{len(self.cells)} of {total} cells stored ({100 - 100 * len(self.cells) // total}% saved)"


# ---------- aliasing and copying ----------

def aliasing_demo():
    a = [1, 2, [3, 4]]
    alias = a
    shallow = a[:]  # or copy.copy(a)
    deep = copy.deepcopy(a)
    alias[0] = "X"
    a[2][0] = "Y"
    return {
        "a": a, "alias (b = a)": alias, "shallow (a[:])": shallow, "deep (deepcopy)": deep,
        "alias is a": alias is a, "shallow is a": shallow is a,
        "shallow[2] is a[2]": shallow[2] is a[2], "deep[2] is a[2]": deep[2] is a[2],
    }


# ---------- sets and sorting (CO4) ----------

def set_ops(a, b):
    a, b = set(a), set(b)
    return {"A | B": sorted(a | b), "A & B": sorted(a & b), "A - B": sorted(a - b), "B - A": sorted(b - a), "A ^ B": sorted(a ^ b)}


def sort_students(records, key="marks", reverse=True):
    """records: list of (name, marks, age) tuples."""
    index = {"name": 0, "marks": 1, "age": 2}[key]
    # sort by name first, then by the chosen key: sorted() is stable, so ties stay alphabetical
    by_name = sorted(records, key=lambda r: r[0])
    return sorted(by_name, key=lambda r: r[index], reverse=reverse)


def bubble_sort(nums):
    # written by hand so each pass can be shown; sorted() is what you'd really use
    nums = list(nums)
    passes = []
    for i in range(len(nums) - 1):
        swapped = False
        for j in range(len(nums) - 1 - i):
            if nums[j] > nums[j + 1]:
                nums[j], nums[j + 1] = nums[j + 1], nums[j]
                swapped = True
        passes.append(list(nums))
        if not swapped:
            break
    return passes


if __name__ == "__main__":
    print(slice_info("PYTHON", 1, None, 2))
    print(aliasing_demo())
    m = SparseMatrix(4, 4)
    m[0, 1] = 5
    m[3, 2] = 7
    print(m.dense(), m.saving())
