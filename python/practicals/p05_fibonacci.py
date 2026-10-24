# Practical 5: enter the number of terms and print the Fibonacci series


def fibonacci(terms):
    series = []
    a, b = 0, 1
    for _ in range(terms):
        series.append(a)
        a, b = b, a + b
    return series


def main():
    terms = int(input("How many terms? "))
    if terms <= 0:
        print("Please enter a positive number")
    else:
        print("Fibonacci series:", *fibonacci(terms))


if __name__ == "__main__":
    main()
