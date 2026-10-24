# Practical 13: implement a stack using a list


class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if self.is_empty():
            raise IndexError("pop from an empty stack (underflow)")
        return self.items.pop()

    def peek(self):
        return self.items[-1] if self.items else None

    def is_empty(self):
        return len(self.items) == 0

    def __len__(self):
        return len(self.items)

    def __str__(self):
        return "[" + ", ".join(map(str, self.items)) + "]  <- top"


def balanced(expr):
    # a real use of a stack: are the brackets balanced?
    pairs = {")": "(", "]": "[", "}": "{"}
    s = Stack()
    for ch in expr:
        if ch in "([{":
            s.push(ch)
        elif ch in pairs:
            if s.is_empty() or s.pop() != pairs[ch]:
                return False
    return s.is_empty()


def main():
    s = Stack()
    print("Commands: push <x>, pop, peek, show, check <expression>, quit")
    while True:
        cmd = input("> ").strip()
        if cmd in ("quit", ""):
            break
        op, _, arg = cmd.partition(" ")
        if op == "push":
            s.push(arg)
            print("pushed", arg, "->", s)
        elif op == "pop":
            try:
                print("popped", s.pop(), "->", s)
            except IndexError as err:
                print("Error:", err)
        elif op == "peek":
            print("top is", s.peek())
        elif op == "show":
            print(s, f"(size {len(s)})")
        elif op == "check":
            print(arg, "is balanced" if balanced(arg) else "is NOT balanced")
        else:
            print("unknown command")


if __name__ == "__main__":
    main()
