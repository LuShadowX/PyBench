# python -m pybench   (run from the python/ folder)

import os
import runpy
import sys

from . import UNITS, __version__

HERE = os.path.dirname(os.path.abspath(__file__))
PRACTICALS = os.path.join(HERE, "..", "practicals")


def list_practicals():
    return sorted(f for f in os.listdir(PRACTICALS) if f.startswith("p") and f.endswith(".py"))


def menu():
    print(f"PyBench {__version__}  |  Python {sys.version.split()[0]}")
    print("-" * 40)
    for n, (_, title) in UNITS.items():
        print(f"  u{n}  Unit {n}: {title}")
    print("  p   list the 15 practicals, p1 ... p15 runs one")
    print("  m   MailGuard on the sample phishing mails")
    print("  q   quit")


def main():
    menu()
    while True:
        try:
            choice = input("\npybench> ").strip().lower()
        except EOFError:
            break
        if choice in ("q", "quit", "exit"):
            break
        if choice == "p":
            for i, name in enumerate(list_practicals(), 1):
                print(f"  p{i:<3}{name}")
        elif choice.startswith("p") and choice[1:].isdigit():
            files = list_practicals()
            i = int(choice[1:])
            if 1 <= i <= len(files):
                runpy.run_path(os.path.join(PRACTICALS, files[i - 1]), run_name="__main__")
            else:
                print(f"there are {len(files)} practicals")
        elif choice.startswith("u") and choice[1:].isdigit() and int(choice[1:]) in UNITS:
            runpy.run_module(f"{__package__}.{UNITS[int(choice[1:])][0]}", run_name="__main__", alter_sys=False)
        elif choice == "m":
            from .mailguard import main as mailguard
            mailguard()
        elif choice:
            menu()


if __name__ == "__main__":
    main()
