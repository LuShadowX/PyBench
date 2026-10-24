# Practical 14: take a sample of ten phishing e-mails and find the most common words

import os
import re

FOLDER = os.path.join(os.path.dirname(__file__), "..", "data", "phishing")
STOPWORDS = {"the", "and", "your", "you", "our", "for", "with", "this", "that", "will", "from", "are", "has", "have",
             "been", "not", "was", "can", "all", "any", "dear", "please", "regards", "team", "hello", "within", "here",
             "http", "https", "www", "com"}


def most_common(folder=FOLDER, n=10):
    counts = {}
    files = sorted(name for name in os.listdir(folder) if name.endswith(".txt"))
    for name in files:
        with open(os.path.join(folder, name), encoding="utf-8") as f:
            head, _, body = f.read().partition("\n\n")
        subject = re.search(r"^Subject:(.*)$", head, re.M)
        text = (subject.group(1) if subject else "") + " " + body
        for word in re.findall(r"[a-z]+", text.lower()):
            if len(word) > 2 and word not in STOPWORDS:
                counts[word] = counts.get(word, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return files, ranked[:n]


def main():
    n = int(input("How many top words? ") or 10)
    files, top = most_common(n=n)
    print(f"Read {len(files)} phishing e-mails\n")
    width = top[0][1] if top else 1
    for word, count in top:
        print(f"{word:<12} {count:3}  {'#' * round(25 * count / width)}")


if __name__ == "__main__":
    main()
