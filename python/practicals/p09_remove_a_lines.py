# Practical 9: remove all the lines that contain the character "a" and write them into another file

import os

DATA = os.path.join(os.path.dirname(__file__), "..", "data")


def split_lines(src, kept_path, removed_path, char="a"):
    kept = removed = 0
    with open(src, encoding="utf-8") as f, open(kept_path, "w", encoding="utf-8") as keep, open(removed_path, "w", encoding="utf-8") as out:
        for line in f:
            if char in line.lower():
                out.write(line)
                removed += 1
            else:
                keep.write(line)
                kept += 1
    return kept, removed


def main():
    src = os.path.join(DATA, "story.txt")
    kept_path, removed_path = "without_a.txt", "lines_with_a.txt"
    kept, removed = split_lines(src, kept_path, removed_path)
    print(f"{removed} lines contained 'a' and were moved to {removed_path}")
    print(f"{kept} lines were kept in {kept_path}\n")
    print(f"--- {kept_path} ---")
    with open(kept_path, encoding="utf-8") as f:
        print(f.read() or "(empty)")
    print(f"--- {removed_path} ---")
    with open(removed_path, encoding="utf-8") as f:
        print(f.read())


if __name__ == "__main__":
    main()
