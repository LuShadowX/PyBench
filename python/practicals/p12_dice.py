# Practical 12: a random number generator that simulates a dice (1 to 6)

import random

FACES = {1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅"}


def roll():
    return random.randint(1, 6)


def main():
    times = int(input("How many times to roll? "))
    counts = {face: 0 for face in FACES}
    rolls = []
    for _ in range(times):
        r = roll()
        rolls.append(r)
        counts[r] += 1
    print("Rolls:", " ".join(FACES[r] for r in rolls[:30]), "..." if times > 30 else "")
    print()
    for face, count in counts.items():
        bar = "#" * round(40 * count / max(times, 1))
        print(f"{face} {FACES[face]}  {count:4}  {bar}")


if __name__ == "__main__":
    main()
