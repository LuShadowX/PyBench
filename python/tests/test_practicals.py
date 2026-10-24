import io
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "practicals"))

import p01_arithmetic, p02_perfect, p03_armstrong, p04_factorial, p05_fibonacci  # noqa: E401,E402
import p06_palindrome, p07_recursive_factorial, p08_read_lines, p09_remove_a_lines, p10_char_count  # noqa: E401,E402
import p11_binary_roll, p12_dice, p13_stack, p14_phishing_words, p15_hash_words  # noqa: E401,E402


def run(module, *answers):
    """Runs a practical's main() with fake keyboard input and returns what it printed."""
    out = io.StringIO()
    with mock.patch("builtins.input", side_effect=list(answers)), redirect_stdout(out):
        module.main()
    return out.getvalue()


class Practicals(unittest.TestCase):
    def test_p01(self):
        r = p01_arithmetic.arithmetic(17, 5)
        self.assertEqual((r["/"], r["//"], r["%"]), (3.4, 3, 2))
        self.assertIn("undefined", p01_arithmetic.arithmetic(1, 0)["/"])
        self.assertIn("17 // 5 = 3", run(p01_arithmetic, "17", "5"))

    def test_p02(self):
        self.assertEqual([n for n in range(1, 10000) if p02_perfect.is_perfect(n)], [6, 28, 496, 8128])

    def test_p03(self):
        self.assertEqual([n for n in range(1, 1000) if p03_armstrong.is_armstrong(n)], [1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407])

    def test_p04_p07(self):
        for n in range(10):
            self.assertEqual(p04_factorial.factorial(n), p07_recursive_factorial.factorial(n))
        self.assertIn("Error", run(p04_factorial, "-3"))
        self.assertIn("5! = 120", run(p07_recursive_factorial, "5"))

    def test_p05(self):
        self.assertEqual(p05_fibonacci.fibonacci(10), [0, 1, 1, 2, 3, 5, 8, 13, 21, 34])
        self.assertIn("positive", run(p05_fibonacci, "0"))

    def test_p06(self):
        self.assertTrue(p06_palindrome.is_palindrome("Madam"))
        self.assertTrue(p06_palindrome.is_palindrome("A man, a plan, a canal: Panama"))
        self.assertFalse(p06_palindrome.is_palindrome("python"))

    def test_files(self):
        lines = p08_read_lines.read_lines(p08_read_lines.DEFAULT)
        self.assertEqual(len(lines), 6)
        self.assertIn("File not found", run(p08_read_lines, "no_such_file.txt"))
        with tempfile.TemporaryDirectory() as d:
            kept, removed = p09_remove_a_lines.split_lines(p08_read_lines.DEFAULT, os.path.join(d, "k"), os.path.join(d, "r"))
            self.assertEqual(kept + removed, 6)
            with open(os.path.join(d, "k")) as f:
                self.assertNotIn("a", f.read().lower())
        stats = p10_char_count.char_stats("Hello World 42")
        self.assertEqual((stats["vowels"], stats["consonants"], stats["uppercase"], stats["digits"]), (3, 7, 2, 2))
        self.assertEqual(p15_hash_words.hash_line("one  two three\n"), "one#two#three")

    def test_p11(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "s.dat")
            p11_binary_roll.create({1: "Aman", 2: "Riya"}, path)
            self.assertEqual(p11_binary_roll.search(2, path), "Riya")
            self.assertIsNone(p11_binary_roll.search(9, path))
            self.assertIsNone(p11_binary_roll.search(1, os.path.join(d, "missing.dat")))

    def test_p12(self):
        rolls = [p12_dice.roll() for _ in range(3000)]
        self.assertEqual(set(rolls), {1, 2, 3, 4, 5, 6})

    def test_p13(self):
        s = p13_stack.Stack()
        s.push(1)
        s.push(2)
        self.assertEqual((s.pop(), s.peek(), len(s)), (2, 1, 1))
        s.pop()
        with self.assertRaises(IndexError):
            s.pop()
        self.assertTrue(p13_stack.balanced("{[()()]}"))
        self.assertFalse(p13_stack.balanced("([)]"))
        self.assertIn("popped b", run(p13_stack, "push a", "push b", "pop", "quit"))

    def test_p14(self):
        files, top = p14_phishing_words.most_common(n=5)
        self.assertEqual(len(files), 10)
        self.assertEqual(top[0][0], "refund")
        self.assertNotIn("com", dict(top))


if __name__ == "__main__":
    unittest.main()
