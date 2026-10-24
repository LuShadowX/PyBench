# Practical 3: check if a number is an Armstrong number
# (sum of each digit raised to the number of digits equals the number, e.g. 153 = 1^3 + 5^3 + 3^3)


def is_armstrong(n):
    digits = len(str(n))
    total = 0
    temp = n
    while temp > 0:
        total += (temp % 10) ** digits
        temp //= 10
    return total == n


def main():
    n = int(input("Enter a number: "))
    k = len(str(n))
    print(" + ".join(f"{d}^{k}" for d in str(n)), "=", sum(int(d) ** k for d in str(n)))
    print(n, "is an Armstrong number" if is_armstrong(n) else "is not an Armstrong number")


if __name__ == "__main__":
    main()
