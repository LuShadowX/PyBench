import os
import tempfile
import unittest

from pybench import unit1_basics as u1
from pybench import unit2_control as u2
from pybench import unit3_data as u3
from pybench import unit4_functions as u4
from pybench import unit5_oop as u5
from pybench import unit6_files as u6


class Unit1(unittest.TestCase):
    def test_names(self):
        self.assertFalse(u1.check_name("class")[0])
        self.assertFalse(u1.check_name("1st")[0])
        self.assertFalse(u1.check_name("my-var")[0])
        self.assertTrue(u1.check_name("total_marks")[0])
        self.assertIn("built-in", u1.check_name("print")[1])

    def test_order_of_operations(self):
        steps, result = u1.evaluation_steps("2 + 3 * 4 ** 2 // 5")
        self.assertEqual(result, 2 + 3 * 4 ** 2 // 5)
        self.assertEqual(steps[0], "4 ** 2 = 16")
        self.assertEqual(u1.evaluation_steps("2 ** 3 ** 2")[1], 512)  # right to left
        self.assertIn("short-circuit", u1.evaluation_steps("0 and 1 / 1")[0][-1])

    def test_name_error(self):
        self.assertIn("NameError", u1.name_error_demo("print(score)"))

    def test_types(self):
        self.assertEqual(u1.literal_type("3.5")["type"], "float")
        self.assertTrue(u1.literal_type("[1]")["mutable"])


class Unit2(unittest.TestCase):
    def test_modulus(self):
        self.assertEqual(u2.clock_after(10, 5), 3)
        self.assertEqual(u2.clock_after(6, 6), 12)
        self.assertEqual(u2.modulus_facts(-7, 3)["a % b"], 2)

    def test_truth_table(self):
        rows = u2.truth_table("a and not b")
        self.assertEqual([r[-1] for r in rows], [False, False, True, False])
        with self.assertRaises(NameError):
            u2.truth_table("a and c")

    def test_conditionals(self):
        self.assertEqual([u2.grade(m) for m in (95, 85, 41, 12, 120)], ["O", "A+", "C", "F", "invalid"])
        self.assertEqual(u2.ticket_price(20, True, True), 170)
        self.assertEqual(u2.ticket_price(3, False, True), 0)
        self.assertTrue(u2.leap_year(2000))
        self.assertFalse(u2.leap_year(1900))

    def test_loops(self):
        self.assertEqual(u2.collatz(6), [6, 3, 10, 5, 16, 8, 4, 2, 1])
        self.assertEqual(u2.primes_upto(20), [2, 3, 5, 7, 11, 13, 17, 19])
        self.assertEqual(u2.pattern(3), "*\n* *\n* * *")
        self.assertEqual(u2.guess_game(7, [3, 9, 7]), ["3: too low", "9: too high", "7: correct in 3 tries"])

    def test_random(self):
        rolls = u2.roll_dice(600, seed=42)
        self.assertTrue(all(1 <= r <= 6 for r in rolls))
        self.assertEqual(sum(u2.frequency(rolls).values()), 600)
        self.assertEqual(rolls, u2.roll_dice(600, seed=42))  # same seed, same numbers
        self.assertAlmostEqual(u2.estimate_pi(20000), 3.14, delta=0.05)

    def test_trace(self):
        steps = u2.trace("total = 0\nfor i in range(3):\n    total += i\n")
        self.assertEqual(steps[-1][1]["total"], "3")


class Unit3(unittest.TestCase):
    def test_strings(self):
        self.assertEqual(u3.slice_info("PYTHON", 1, None, 2)["result"], "YHN")
        self.assertEqual(u3.slice_info("PYTHON", None, None, -1)["indices"], [5, 4, 3, 2, 1, 0])
        self.assertEqual(u3.find("banana", "n"), 2)
        self.assertEqual(u3.find("banana", "z"), -1)
        self.assertEqual(u3.count_letter("banana", "a"), 3)
        self.assertIn("<", u3.compare("Apple", "apple"))

    def test_lists(self):
        nums = [1, 2, 3]
        u3.double_all(nums)
        self.assertEqual(nums, [2, 4, 6])
        self.assertEqual(u3.doubled(nums), [4, 8, 12])
        self.assertEqual(nums, [2, 4, 6])
        self.assertEqual(u3.transpose(u3.matrix(2, 3)), [[1, 4], [2, 5], [3, 6]])

    def test_tuples_dicts(self):
        self.assertEqual(u3.swap(1, 2), (2, 1))
        self.assertEqual(u3.min_max_avg([2, 4, 9]), (2, 9, 5.0))
        self.assertIn("TypeError", u3.tuple_is_immutable())
        self.assertEqual(u3.word_count("the cat and THE hat.")["the"], 2)

    def test_sparse(self):
        m = u3.SparseMatrix(3, 3)
        m[0, 0] = 5
        m[2, 1] = 4
        m[0, 0] = 0
        self.assertEqual(m.cells, {(2, 1): 4})
        self.assertEqual(m.dense()[2], [0, 4, 0])

    def test_aliasing(self):
        r = u3.aliasing_demo()
        self.assertTrue(r["alias is a"])
        self.assertFalse(r["shallow is a"])
        self.assertTrue(r["shallow[2] is a[2]"])
        self.assertEqual(r["deep (deepcopy)"], [1, 2, [3, 4]])

    def test_sets_sorting(self):
        self.assertEqual(u3.set_ops([1, 2, 3], [2, 3, 4])["A & B"], [2, 3])
        self.assertEqual(u3.bubble_sort([5, 1, 4, 2])[-1], [1, 2, 4, 5])
        recs = [("Aman", 80, 19), ("Riya", 92, 18), ("Dev", 80, 20)]
        self.assertEqual([r[0] for r in u3.sort_students(recs)], ["Riya", "Aman", "Dev"])
        self.assertEqual([r[0] for r in u3.sort_students(recs, "age", False)], ["Riya", "Aman", "Dev"])


class Unit4(unittest.TestCase):
    def test_conversion(self):
        c = u4.convert("42")
        self.assertEqual(c["int"], "42")
        self.assertIn("ValueError", u4.convert("4.2")["int"])
        self.assertEqual(u4.coercion_examples()[0][2], "float")

    def test_parameters(self):
        self.assertEqual(u4.area(4), 16)
        self.assertEqual(u4.area(4, width=2), 8)
        self.assertEqual(u4.bill(100, 100, tax=0.1, discount=20), 198.0)
        self.assertEqual(u4.describe_call(1, 2, x=3), "args=(1, 2) kwargs={'x': 3}")
        self.assertEqual(u4.scope_demo(), 12)

    def test_recursion(self):
        self.assertEqual(u4.factorial(6), 720)
        with self.assertRaises(ValueError):
            u4.factorial(-1)
        self.assertEqual([u4.fib(i) for i in range(8)], [0, 1, 1, 2, 3, 5, 8, 13])
        self.assertEqual(u4.fib_memo(80), 23416728348467685)
        self.assertEqual(u4.power(3, 13), 3 ** 13)
        self.assertEqual(len(u4.hanoi(5)), 31)
        self.assertEqual(u4.digit_sum(98765), 35)
        self.assertEqual(u4.call_tree("fib", 4)[1], 3)
        plain, memo = u4.count_calls(20)
        self.assertEqual(plain, 21891)
        self.assertLess(memo, 40)


class Unit5(unittest.TestCase):
    def test_classes(self):
        s = u5.Student("Riya", "1201", {"INT108": 90, "CSE111": 80})
        self.assertEqual(s.average(), 85)
        self.assertEqual(s.university, "LPU")
        with self.assertRaises(ValueError):
            s.add_mark("MTH", 150)
        self.assertIn("name", u5.attribute_report(s)["vars(obj)"])

    def test_hiding(self):
        acc = u5.BankAccount("A", 100)
        acc.deposit(50)
        self.assertEqual(acc.balance, 150)
        self.assertFalse(hasattr(acc, "__balance"))
        with self.assertRaises(ValueError):
            acc.withdraw(1000)
        self.assertEqual(len(u5.hiding_demo()), 4)

    def test_inheritance(self):
        shapes = [u5.Rectangle(3, 4), u5.Square(2), u5.Circle(1), u5.Triangle(3, 4, 5)]
        self.assertEqual([round(s.area(), 2) for s in shapes], [12, 4, 3.14, 6.0])
        self.assertEqual(u5.mro(u5.Square), ["Square", "Rectangle", "Shape", "object"])
        self.assertIn("sides", shapes[3].describe())
        with self.assertRaises(NotImplementedError):
            u5.Shape("x").area()
        with self.assertRaises(ValueError):
            u5.Triangle(1, 2, 10)

    def test_overloading(self):
        v = u5.Vector(1, 2) + u5.Vector(3, 4)
        self.assertEqual(v, u5.Vector(4, 6))
        self.assertEqual(u5.Vector(1, 2) * u5.Vector(3, 4), 11)
        self.assertEqual(2 * u5.Vector(1, 2), u5.Vector(2, 4))
        self.assertEqual(abs(u5.Vector(3, 4)), 5)
        c = u5.Calculator()
        self.assertEqual(c.add(1, 2), 3)
        self.assertEqual(c.add(1, 2, 3), 6)
        self.assertEqual(c.add(0.1, 0.2, rounding=2), 0.3)


class Unit6(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.path = os.path.join(self.dir, "notes.txt")

    def test_text_files(self):
        u6.write_notes(self.path, ["one", "two"])
        u6.append_line(self.path, "three")
        r = u6.read_three_ways(self.path)
        self.assertEqual(r["read()"], "one\ntwo\nthree\n")
        self.assertEqual(r["readline()"], "one\n")
        self.assertEqual(r["readlines() after that"], ["two\n", "three\n"])

    def test_variables_and_dirs(self):
        u6.save_variables(self.path, marks=92, cgpa=8.7, name="Lukshya")
        self.assertEqual(u6.load_variables(self.path), {"marks": 92, "cgpa": 8.7, "name": "Lukshya"})
        lines = u6.make_dirs(os.path.join(self.dir, "proj"))
        self.assertIn("data/", lines)

    def test_pickle(self):
        data = {"roll": 7, "marks": [90, 85], "ok": True}
        back, raw = u6.pickle_roundtrip(data, os.path.join(self.dir, "d.pkl"))
        self.assertEqual(back, data)
        self.assertEqual(raw[0], 0x80)  # pickle protocol marker

    def test_exceptions(self):
        self.assertEqual(u6.safe_divide(9, 3), (3.0, ["try", "else (no exception)", "finally (always runs)"]))
        self.assertEqual(u6.safe_divide(1, 0)[1][1], "except ZeroDivisionError")
        self.assertEqual(u6.safe_divide("a", 2)[1][1], "except TypeError")
        self.assertIn("does not exist", u6.read_or_explain(os.path.join(self.dir, "nope.txt")))
        self.assertEqual(u6.word_counts([os.path.join(self.dir, "x.txt")]), {os.path.join(self.dir, "x.txt"): None})

    def test_regex(self):
        text = "Mail riya.k@lpu.in or call +91 9876543210 before 24-10-2026, fee Rs. 1,500"
        self.assertEqual(u6.regex_report(u6.PATTERNS["email"], text)["findall"], ["riya.k@lpu.in"])
        self.assertIsNone(u6.regex_report(u6.PATTERNS["email"], text)["match (start only)"])
        self.assertEqual(u6.regex_report(u6.PATTERNS["date dd-mm-yyyy"], text)["findall"], [("24", "10", "2026")])
        self.assertEqual(len(u6.regex_report(u6.PATTERNS["indian mobile"], text)["findall"]), 1)
        self.assertTrue(u6.validate("password", "Abc@1234"))
        self.assertFalse(u6.validate("password", "abc12345"))
        self.assertFalse(u6.validate("pin code", "012345"))

    def test_scrape(self):
        html = '<title> Shop </title><h1>Deals</h1><div class="product"><h3>Pen</h3><b>₹ 1,200</b><i data-rating="4.5"></i></div><a href="/x">X</a> help@shop.in'
        r = u6.scrape(html)
        self.assertEqual(r["title"], "Shop")
        self.assertEqual(r["links"], [("/x", "X")])
        self.assertEqual(r["emails"], ["help@shop.in"])
        self.assertEqual(u6.scrape_products(html), [("Pen", 1200, 4.5)])


if __name__ == "__main__":
    unittest.main()
