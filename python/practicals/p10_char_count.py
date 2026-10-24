# Practical 10: count vowels, consonants, uppercase and lowercase characters in a text file

import os

DEFAULT = os.path.join(os.path.dirname(__file__), "..", "data", "story.txt")


def char_stats(text):
    stats = {"vowels": 0, "consonants": 0, "uppercase": 0, "lowercase": 0, "digits": 0, "spaces": 0}
    for ch in text:
        if ch.isalpha():
            if ch.lower() in "aeiou":
                stats["vowels"] += 1
            else:
                stats["consonants"] += 1
            if ch.isupper():
                stats["uppercase"] += 1
            else:
                stats["lowercase"] += 1
        elif ch.isdigit():
            stats["digits"] += 1
        elif ch == " ":
            stats["spaces"] += 1
    return stats


def main():
    path = input("File name (Enter for story.txt): ").strip() or DEFAULT
    try:
        with open(path, encoding="utf-8") as f:
            stats = char_stats(f.read())
    except FileNotFoundError:
        print("File not found:", path)
        return
    for name, count in stats.items():
        print(f"{name:<11} {count}")


if __name__ == "__main__":
    main()
