# Practical 1: enter two numbers and print +, -, *, /, // and %


def arithmetic(a, b):
    results = {"+": a + b, "-": a - b, "*": a * b}
    if b == 0:
        results.update({"/": "undefined (division by zero)", "//": "undefined", "%": "undefined"})
    else:
        results.update({"/": a / b, "//": a // b, "%": a % b})
    return results


def main():
    a = float(input("Enter first number: "))
    b = float(input("Enter second number: "))
    # show whole numbers without the .0
    a, b = (int(x) if x.is_integer() else x for x in (a, b))
    for op, value in arithmetic(a, b).items():
        print(f"{a} {op} {b} = {value}")


if __name__ == "__main__":
    main()
