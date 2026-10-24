# Practical 7: recursively find the factorial of a natural number


def factorial(n):
    if n <= 1:  # base case
        return 1
    return n * factorial(n - 1)  # recursive case


def show_calls(n, depth=0):
    # prints the calls going down and the results coming back up
    print("  " * depth + f"factorial({n})")
    if n <= 1:
        print("  " * depth + "returns 1")
        return 1
    result = n * show_calls(n - 1, depth + 1)
    print("  " * depth + f"returns {n} * factorial({n - 1}) = {result}")
    return result


def main():
    n = int(input("Enter a natural number: "))
    if n < 1:
        print("A natural number starts from 1")
        return
    show_calls(n)
    print(f"\n{n}! = {factorial(n)}")


if __name__ == "__main__":
    main()
