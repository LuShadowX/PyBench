# Practical 4: factorial of the entered number (using a loop)


def factorial(n):
    if n < 0:
        raise ValueError("factorial of a negative number does not exist")
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result


def main():
    n = int(input("Enter a number: "))
    try:
        print(f"{n}! = {factorial(n)}")
    except ValueError as err:
        print("Error:", err)


if __name__ == "__main__":
    main()
