# Practical 8: read a file line by line and print it

import os

DEFAULT = os.path.join(os.path.dirname(__file__), "..", "data", "story.txt")


def read_lines(path):
    lines = []
    with open(path, encoding="utf-8") as f:
        for line in f:  # the file object gives one line at a time
            lines.append(line.rstrip("\n"))
    return lines


def main():
    path = input("File name (Enter for story.txt): ").strip() or DEFAULT
    try:
        for number, line in enumerate(read_lines(path), start=1):
            print(f"{number:2}: {line}")
    except FileNotFoundError:
        print("File not found:", path)


if __name__ == "__main__":
    main()
