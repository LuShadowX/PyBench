# Practical 6: check if a string is a palindrome using a loop


def is_palindrome(text, ignore_case_and_spaces=True):
    if ignore_case_and_spaces:
        text = "".join(c.lower() for c in text if c.isalnum())
    i, j = 0, len(text) - 1
    while i < j:
        if text[i] != text[j]:
            return False
        i += 1
        j -= 1
    return True


def main():
    text = input("Enter a string: ")
    if is_palindrome(text):
        print(f'"{text}" is a palindrome')
    else:
        print(f'"{text}" is not a palindrome')


if __name__ == "__main__":
    main()
