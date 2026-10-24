# Unit V: classes and objects, inheritance, overriding, data hiding, overloading

import math


# ---------- creating classes, instances, attributes ----------

class Student:
    university = "LPU"  # class attribute, shared by every student
    count = 0

    def __init__(self, name, reg_no, marks=None):
        self.name = name  # instance attributes
        self.reg_no = reg_no
        self.marks = dict(marks or {})
        Student.count += 1

    def add_mark(self, subject, mark):
        if not 0 <= mark <= 100:
            raise ValueError("marks must be between 0 and 100")
        self.marks[subject] = mark

    def average(self):
        return round(sum(self.marks.values()) / len(self.marks), 2) if self.marks else 0

    def __str__(self):
        return f"{self.name} ({self.reg_no}), average {self.average()}"

    def __repr__(self):
        return f"Student({self.name!r}, {self.reg_no!r})"


def attribute_report(obj):
    """Shows what getattr / hasattr / vars() see on an object."""
    return {
        "type": type(obj).__name__,
        "vars(obj)": {k: v for k, v in vars(obj).items()},
        "class attributes": {k: v for k, v in vars(type(obj)).items() if not k.startswith("_") and not callable(v)},
        "methods": [k for k, v in vars(type(obj)).items() if callable(v) and not k.startswith("__")],
        "hasattr(obj, 'name')": hasattr(obj, "name"),
    }


# ---------- data hiding ----------

class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._history = []  # one underscore: "internal, please don't touch"
        self.__balance = balance  # two underscores: name mangled to _BankAccount__balance

    @property
    def balance(self):
        return self.__balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self.__balance += amount
        self._history.append(("deposit", amount))

    def withdraw(self, amount):
        if amount > self.__balance:
            raise ValueError(f"insufficient balance ({self.__balance})")
        self.__balance -= amount
        self._history.append(("withdraw", amount))


def hiding_demo():
    acc = BankAccount("Lukshya", 1000)
    acc.deposit(500)
    log = [f"acc.balance -> {acc.balance}"]
    try:
        acc.__balance
    except AttributeError as err:
        log.append(f"acc.__balance -> AttributeError: {err}")
    log.append(f"acc._BankAccount__balance -> {acc._BankAccount__balance} (mangled name, still reachable)")
    try:
        acc.balance = 10**6
    except AttributeError as err:
        log.append(f"acc.balance = 1000000 -> AttributeError: {err}")
    return log


# ---------- inheritance and overriding (polymorphism) ----------

class Shape:
    def __init__(self, name):
        self.name = name

    def area(self):
        raise NotImplementedError("every shape must override area()")

    def perimeter(self):
        raise NotImplementedError

    def describe(self):
        return f"{self.name}: area {self.area():.2f}, perimeter {self.perimeter():.2f}"


class Rectangle(Shape):
    def __init__(self, w, h):
        super().__init__("Rectangle")
        self.w, self.h = w, h

    def area(self):
        return self.w * self.h

    def perimeter(self):
        return 2 * (self.w + self.h)


class Square(Rectangle):
    # multilevel: Square -> Rectangle -> Shape
    def __init__(self, side):
        super().__init__(side, side)
        self.name = "Square"


class Circle(Shape):
    def __init__(self, r):
        super().__init__("Circle")
        self.r = r

    def area(self):
        return math.pi * self.r ** 2

    def perimeter(self):
        return 2 * math.pi * self.r


class Triangle(Shape):
    def __init__(self, a, b, c):
        if a + b <= c or a + c <= b or b + c <= a:
            raise ValueError("those sides don't make a triangle")
        super().__init__("Triangle")
        self.sides = (a, b, c)

    def area(self):
        a, b, c = self.sides
        s = (a + b + c) / 2
        return math.sqrt(s * (s - a) * (s - b) * (s - c))

    def perimeter(self):
        return sum(self.sides)

    def describe(self):
        # overriding and still using the parent's version
        return super().describe() + f", sides {self.sides}"


def mro(cls):
    return [c.__name__ for c in cls.__mro__]


# ---------- function / operator overloading ----------

class Vector:
    """Python has no two methods with the same name, so 'overloading' is done with
    default / variable arguments and with operator methods like __add__."""

    def __init__(self, *coords):
        self.coords = tuple(coords) if coords else (0, 0)

    def __add__(self, other):
        return Vector(*(a + b for a, b in zip(self.coords, other.coords)))

    def __sub__(self, other):
        return Vector(*(a - b for a, b in zip(self.coords, other.coords)))

    def __mul__(self, k):
        if isinstance(k, Vector):  # dot product
            return sum(a * b for a, b in zip(self.coords, k.coords))
        return Vector(*(a * k for a in self.coords))

    __rmul__ = __mul__

    def __eq__(self, other):
        return isinstance(other, Vector) and self.coords == other.coords

    def __len__(self):
        return len(self.coords)

    def __abs__(self):
        return math.sqrt(sum(a * a for a in self.coords))

    def __repr__(self):
        return f"Vector{self.coords}"


class Calculator:
    def add(self, *nums, rounding=None):
        # one add() covers add(a, b), add(a, b, c) and add(a, b, rounding=2)
        total = sum(nums)
        return round(total, rounding) if rounding is not None else total


if __name__ == "__main__":
    s = Student("Lukshya", "12345", {"INT108": 92})
    print(s, attribute_report(s))
    for shape in (Rectangle(3, 4), Square(2), Circle(1), Triangle(3, 4, 5)):
        print(shape.describe())
    print(Vector(1, 2) + Vector(3, 4), Vector(1, 2) * 3, Vector(1, 2) * Vector(3, 4))
    print(hiding_demo())
