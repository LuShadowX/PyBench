# Practical 11: create a binary file with name and roll no., search a roll number
# and show the name, or a message if it is not there

import pickle

FILE = "students.dat"


def create(records, path=FILE):
    with open(path, "wb") as f:
        pickle.dump(records, f)


def search(roll, path=FILE):
    try:
        with open(path, "rb") as f:
            records = pickle.load(f)
    except FileNotFoundError:
        return None
    return records.get(roll)


def main():
    records = {}
    n = int(input("How many students? "))
    for _ in range(n):
        roll = int(input("Roll no: "))
        name = input("Name: ").strip()
        records[roll] = name
    create(records)
    print(f"Saved {len(records)} records to {FILE}\n")
    roll = int(input("Roll no to search: "))
    name = search(roll)
    if name:
        print(f"Roll no {roll} belongs to {name}")
    else:
        print(f"No student with roll no {roll} was found")


if __name__ == "__main__":
    main()
