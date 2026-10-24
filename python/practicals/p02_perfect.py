# Practical 2: find whether a number is perfect (sum of its proper divisors equals the number)


def proper_divisors(n):
    divisors = []
    for d in range(1, n // 2 + 1):
        if n % d == 0:
            divisors.append(d)
    return divisors


def is_perfect(n):
    return n > 1 and sum(proper_divisors(n)) == n


def main():
    n = int(input("Enter a number: "))
    divs = proper_divisors(n)
    print("Proper divisors:", " + ".join(map(str, divs)), "=", sum(divs))
    if is_perfect(n):
        print(n, "is a perfect number")
    else:
        print(n, "is not a perfect number")


if __name__ == "__main__":
    main()
