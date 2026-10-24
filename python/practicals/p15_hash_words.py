# Practical 15: read a text file line by line and display each word separated by a #

import os

DEFAULT = os.path.join(os.path.dirname(__file__), "..", "data", "story.txt")


def hash_line(line):
    return "#".join(line.split())


def main():
    path = input("File name (Enter for story.txt): ").strip() or DEFAULT
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                print(hash_line(line))
    except FileNotFoundError:
        print("File not found:", path)


if __name__ == "__main__":
    main()
