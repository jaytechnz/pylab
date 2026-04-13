// ─── Model Solutions — PyLab Pre-IG Stage 1 ────────────────────────────────────
// Python 3 solutions for all 130 exercises, keyed by exercise ID.
// For teacher reference and automated testing.

export const SOLUTIONS = {

// ══════════════════════════════════════════════════════════════════════════════
// VARIABLES & I/O
// ══════════════════════════════════════════════════════════════════════════════

'var-01': `\
print("Hello, World!")
`,

'var-02': `\
first_name = "Alice"
print(first_name)
`,

'var-03': `\
age = 13
print(age)
`,

'var-04': `\
price = 4.99
print(price)
`,

'var-05': `\
is_logged_in = True
print(is_logged_in)
`,

'var-06': `\
subject = "Python"
year = 9
score = 87.5
print(subject)
print(year)
print(score)
`,

'var-07': `\
name = input()
print("Hello, " + name + "!")
`,

'var-08': `\
first_name = input()
last_name = input()
print(first_name + " " + last_name)
`,

'var-09': `\
text = "Python! "
print(text * 3)
`,

'var-10': `\
a = 1
b = 1.0
c = "hello"
d = True
print(type(a))
print(type(b))
print(type(c))
print(type(d))
`,

'var-11': `\
# My first Python program
message = "Hello from Python!"
print(message)
`,

'var-12': `\
age = input()
print("You are " + age + " years old.")
`,

'var-13': `\
name = input()
subject = input()
print(f"Hi {name}, I love {subject} too!")
`,

'var-14': `\
name = input()
age = input()
print("Name: " + name)
print("Age: " + age)
`,

'var-15': `\
a = 10
b = 20
a, b = b, a
print(a)
print(b)
`,

'var-16': `\
colour = input()
food = input()
sport = input()
print(colour + ", " + food + ", " + sport)
`,

'var-17': `\
temp = input()
print("The temperature is " + temp + " degrees Celsius.")
`,

'var-18': `\
score = 0
score = 10
score = 25
print(score)
`,

'var-19': `\
item = input()
quantity = int(input())
price = float(input())
total = quantity * price
print("Item: " + item)
print("Quantity: " + str(quantity))
print("Price each: " + str(price))
print("Total: " + str(total))
`,

'var-20': `\
noun = input()
verb = input()
adjective = input()
number = input()
print(f"The {adjective} {noun} decided to {verb} exactly {number} times!")
`,

'var-21': `\
name = input()
char_class = input()
level = int(input())
health = int(input())
print("=== Character Profile ===")
print("Name: " + name)
print("Class: " + char_class)
print("Level: " + str(level))
print("Health: " + str(health) + " HP")
`,

'var-22': `\
a = input()
b = input()
print(a + " and " + b + " are your numbers.")
print("Their combined text is: " + a + b)
`,

// ══════════════════════════════════════════════════════════════════════════════
// OPERATORS & TYPE CASTING
// ══════════════════════════════════════════════════════════════════════════════

'ops-01': `\
a = int(input())
b = int(input())
print(a + b)
`,

'ops-02': `\
a = int(input())
b = int(input())
print(a - b)
`,

'ops-03': `\
a = int(input())
b = int(input())
print(a * b)
`,

'ops-04': `\
a = int(input())
b = int(input())
print(a / b)
`,

'ops-05': `\
a = int(input())
b = int(input())
print(a // b)
`,

'ops-06': `\
a = int(input())
b = int(input())
print(a % b)
`,

'ops-07': `\
base = int(input())
exponent = int(input())
print(base ** exponent)
`,

'ops-08': `\
a = int(input())
b = int(input())
print(a / b)
print(a // b)
print(a % b)
`,

'ops-09': `\
num = int(input())
print(num % 2 == 0)
`,

'ops-10': `\
year = int(input())
print(2030 - year)
`,

'ops-11': `\
weight_kg = float(input())
print(round(weight_kg * 2.205, 2))
`,

'ops-12': `\
num = 42
print(str(num) + " is the answer!")
`,

'ops-13': `\
score = 100
score += 50
score -= 30
score *= 2
score //= 3
score += score % 7
print(score)
`,

'ops-14': `\
pi = 3.14159
radius = float(input())
area = pi * radius ** 2
print(round(area, 2))
`,

'ops-15': `\
celsius = float(input())
fahrenheit = celsius * 9 / 5 + 32
print(fahrenheit)
`,

'ops-16': `\
weight = float(input())
height = float(input())
bmi = weight / height ** 2
print(round(bmi, 1))
`,

'ops-17': `\
total = int(input())
hours = total // 3600
remaining = total % 3600
minutes = remaining // 60
seconds = remaining % 60
print(str(hours) + " hours, " + str(minutes) + " minutes, " + str(seconds) + " seconds")
`,

'ops-18': `\
price = float(input())
percent = int(input())
discount = price * (percent / 100)
final = price - discount
print("Discounted price: " + str(round(final, 2)))
`,

'ops-19': `\
a = float(input())
b = float(input())
h = (a ** 2 + b ** 2) ** 0.5
print(round(h, 2))
`,

'ops-20': `\
distance = float(input())
time = float(input())
speed = distance / time
print(round(speed, 2))
print(speed > 100)
`,

// ══════════════════════════════════════════════════════════════════════════════
// SELECTION
// ══════════════════════════════════════════════════════════════════════════════

'sel-01': `\
score = int(input())
if score >= 50:
    print("Pass")
else:
    print("Fail")
`,

'sel-02': `\
num = int(input())
if num > 0:
    print("Positive")
elif num < 0:
    print("Negative")
else:
    print("Zero")
`,

'sel-03': `\
age = int(input())
if age < 13:
    print("Child")
elif age <= 17:
    print("Teenager")
else:
    print("Adult")
`,

'sel-04': `\
score = int(input())
if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
elif score >= 60:
    print("D")
else:
    print("F")
`,

'sel-05': `\
num = int(input())
if num % 2 == 0:
    print("Even")
else:
    print("Odd")
`,

'sel-06': `\
colour = input()
if colour == "red":
    print("Stop")
elif colour == "amber":
    print("Caution")
elif colour == "green":
    print("Go")
else:
    print("Unknown colour")
`,

'sel-07': `\
a = int(input())
b = int(input())
if a > b:
    print(a)
elif b > a:
    print(b)
else:
    print("Equal")
`,

'sel-08': `\
num = int(input())
if num % 3 == 0 and num % 5 == 0:
    print("Divisible by both 3 and 5")
elif num % 3 == 0:
    print("Divisible by 3 only")
elif num % 5 == 0:
    print("Divisible by 5 only")
else:
    print("Divisible by neither")
`,

'sel-09': `\
correct_password = "python3"
password = input()
if password == correct_password:
    print("Access granted")
else:
    print("Access denied")
`,

'sel-10': `\
year = int(input())
if (year % 4 == 0) and (year % 100 != 0 or year % 400 == 0):
    print("Leap year")
else:
    print("Not a leap year")
`,

'sel-11': `\
month = int(input())
if month == 12 or month == 1 or month == 2:
    print("Winter")
elif month == 3 or month == 4 or month == 5:
    print("Spring")
elif month == 6 or month == 7 or month == 8:
    print("Summer")
else:
    print("Autumn")
`,

'sel-12': `\
a = float(input())
b = float(input())
op = input()
if op == "+":
    print(a + b)
elif op == "-":
    print(a - b)
elif op == "*":
    print(a * b)
elif op == "/":
    if b == 0:
        print("Error: division by zero")
    else:
        print(a / b)
`,

'sel-13': `\
num = int(input())
if 1 <= num <= 100:
    print("In range")
else:
    print("Out of range")
`,

'sel-14': `\
age = int(input())
if age < 5:
    print("Ticket price: \u00a30")
elif age <= 12:
    print("Ticket price: \u00a35")
elif age <= 17:
    print("Ticket price: \u00a38")
elif age <= 64:
    print("Ticket price: \u00a312")
else:
    print("Ticket price: \u00a36")
`,

'sel-15': `\
p1 = input()
p2 = input()
if p1 == p2:
    print("Draw")
elif (p1 == "rock" and p2 == "scissors") or \
     (p1 == "paper" and p2 == "rock") or \
     (p1 == "scissors" and p2 == "paper"):
    print("Player 1 wins")
else:
    print("Player 2 wins")
`,

'sel-16': `\
score1 = int(input())
score2 = int(input())
score3 = int(input())
score4 = int(input())
avg = (score1 + score2 + score3 + score4) / 4
print("Average: " + str(round(avg, 1)))
if avg >= 90:
    print("Grade: A")
elif avg >= 80:
    print("Grade: B")
elif avg >= 70:
    print("Grade: C")
elif avg >= 60:
    print("Grade: D")
else:
    print("Grade: F")
`,

'sel-17': `\
num = int(input())
if num % 3 == 0 and num % 5 == 0:
    print("FizzBuzz")
elif num % 3 == 0:
    print("Fizz")
elif num % 5 == 0:
    print("Buzz")
else:
    print(num)
`,

'sel-18': `\
weight = float(input())
if weight <= 1:
    print("Shipping cost: \u00a33.5")
elif weight <= 5:
    print("Shipping cost: \u00a35.0")
elif weight <= 20:
    print("Shipping cost: \u00a38.5")
else:
    print("Shipping cost: \u00a315.0")
`,

'sel-19': `\
password = input()
length = len(password)
has_digit = any(c.isdigit() for c in password)
if length < 6:
    print("Weak")
elif length >= 12 or (length >= 8 and has_digit):
    print("Strong")
else:
    print("Medium")
`,

'sel-20': `\
age = int(input())
rated_15_plus = input()
if rated_15_plus == "yes" and age < 15:
    print("Entry denied: age restriction")
else:
    print("Entry allowed")
`,

'sel-21': `\
day = int(input())
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
if 1 <= day <= 7:
    print(days[day - 1])
else:
    print("Invalid day number")
`,

'sel-22': `\
num = int(input())
if num > 0:
    print("Positive")
elif num < 0:
    print("Negative")
else:
    print("Zero")
if num % 2 == 0:
    print("Even")
else:
    print("Odd")
if num % 5 == 0:
    print("Multiple of 5")
`,

// ══════════════════════════════════════════════════════════════════════════════
// ITERATION
// ══════════════════════════════════════════════════════════════════════════════

'itr-01': `\
for i in range(1, 11):
    print(i)
`,

'itr-02': `\
for i in range(10, 0, -1):
    print(i)
`,

'itr-03': `\
for i in range(5):
    print("*")
`,

'itr-04': `\
total = 0
for i in range(1, 101):
    total += i
print(total)
`,

'itr-05': `\
for i in range(2, 22, 2):
    print(i)
`,

'itr-06': `\
n = int(input())
for i in range(1, 11):
    print(str(n) + " x " + str(i) + " = " + str(n * i))
`,

'itr-07': `\
count = 1
while count <= 5:
    print(count)
    count += 1
`,

'itr-08': `\
total = 0
num = int(input())
while num != 0:
    total += num
    num = int(input())
print(total)
`,

'itr-09': `\
for i in range(1, 21):
    if i % 3 == 0 and i % 5 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
`,

'itr-10': `\
n = int(input())
for i in range(1, n + 1):
    print("*" * i)
`,

'itr-11': `\
n = int(input())
total = 0
for d in str(n):
    total += int(d)
print(total)
`,

'itr-12': `\
while True:
    guess = int(input())
    if guess == 7:
        print("Correct!")
        break
    else:
        print("Wrong!")
`,

'itr-13': `\
n = int(input())
total = 0
for i in range(n):
    total += int(input())
average = total / n
print(average)
`,

'itr-14': `\
n = int(input())
result = 1
for i in range(1, n + 1):
    result *= i
print(result)
`,

'itr-15': `\
n = int(input())
if n <= 1:
    print("Not prime")
else:
    is_prime = True
    for i in range(2, n):
        if n % i == 0:
            is_prime = False
            break
    if is_prime:
        print("Prime")
    else:
        print("Not prime")
`,

'itr-16': `\
n = int(input())
a, b = 0, 1
for i in range(n):
    print(a)
    a, b = b, a + b
`,

'itr-17': `\
correct = "secure99"
for attempt in range(3):
    password = input()
    if password == correct:
        print("Welcome!")
        break
    else:
        print("Incorrect. Try again.")
else:
    print("Account locked.")
`,

'itr-18': `\
n = int(input())
running_total = 0
for i in range(n):
    num = int(input())
    running_total += num
    print(running_total)
`,

'itr-19': `\
n = int(input())
for i in range(1, n + 1):
    print(" ".join(str(j) for j in range(1, i + 1)))
`,

'itr-20': `\
n = int(input())
steps = 0
while n != 1:
    if n % 2 == 0:
        n = n // 2
    else:
        n = 3 * n + 1
    print(n)
    steps += 1
print("Steps: " + str(steps))
`,

'itr-21': `\
word = input()
count = 0
for char in word.lower():
    if char in "aeiou":
        count += 1
print(count)
`,

'itr-22': `\
text = input()
i = len(text) - 1
result = ""
while i >= 0:
    result += text[i]
    i -= 1
print(result)
`,

// ══════════════════════════════════════════════════════════════════════════════
// LISTS
// ══════════════════════════════════════════════════════════════════════════════

'lst-01': `\
fruits = ["apple", "banana", "cherry"]
print(fruits)
`,

'lst-02': `\
colours = ["red", "green", "blue", "yellow"]
print(colours[0])
print(colours[-1])
`,

'lst-03': `\
my_list = [1, 2, 3, 4, 5]
print(len(my_list))
`,

'lst-04': `\
numbers = []
numbers.append(10)
numbers.append(20)
numbers.append(30)
numbers.append(40)
print(numbers)
`,

'lst-05': `\
animals = ["cat", "dog", "fish", "bird"]
for animal in animals:
    print(animal)
`,

'lst-06': `\
numbers = [10, 5, 15, 8, 12]
total = 0
for num in numbers:
    total += num
print(total)
`,

'lst-07': `\
items = []
n = int(input())
for i in range(n):
    items.append(input())
print(items)
`,

'lst-08': `\
my_list = ["a", "b", "c", "d", "e"]
del my_list[2]
print(my_list)
`,

'lst-09': `\
my_list = [1, 2, 3, 4, 5, 3]
my_list.remove(3)
print(my_list)
`,

'lst-10': `\
numbers = []
for i in range(5):
    numbers.append(int(input()))
print(min(numbers))
print(max(numbers))
`,

'lst-11': `\
numbers = []
for i in range(6):
    numbers.append(int(input()))
print(numbers.count(7))
`,

'lst-12': `\
my_list = [1, 2, 3, 4, 5]
my_list.reverse()
print(my_list)
`,

'lst-13': `\
shopping = []
while True:
    item = input()
    if item == "done":
        break
    shopping.append(item)
print(shopping)
`,

'lst-14': `\
n = int(input())
numbers = []
for i in range(n):
    numbers.append(float(input()))
average = sum(numbers) / len(numbers)
print(round(average, 2))
`,

'lst-15': `\
numbers = []
for i in range(7):
    numbers.append(int(input()))
positives = []
for num in numbers:
    if num > 0:
        positives.append(num)
print(positives)
`,

'lst-16': `\
my_list = []
for i in range(5):
    my_list.append(input())
word = input()
if word in my_list:
    print("Found at index " + str(my_list.index(word)))
else:
    print("Not found")
`,

'lst-17': `\
numbers = []
for i in range(5):
    numbers.append(int(input()))
numbers.sort()
print(numbers)
print(numbers[len(numbers) // 2])
`,

'lst-18': `\
a = []
for i in range(4):
    a.append(int(input()))
b = []
for i in range(4):
    b.append(int(input()))
c = []
for i in range(4):
    c.append(a[i] + b[i])
print(c)
`,

'lst-19': `\
lst = []
for i in range(6):
    lst.append(int(input()))
unique = []
for x in lst:
    if x not in unique:
        unique.append(x)
print(unique)
`,

'lst-20': `\
names = []
scores = []
for i in range(5):
    names.append(input())
    scores.append(int(input()))
max_score = max(scores)
idx = scores.index(max_score)
print("Top student: " + names[idx] + " (" + str(max_score) + ")")
`,

'lst-21': `\
list_a = [1, 3, 5, 7]
list_b = [2, 4, 6, 8]
combined = list_a + list_b
combined.sort()
print(combined)
`,

'lst-22': `\
inventory = ["sword", "shield", "potion"]
for i in range(3):
    cmd = input()
    parts = cmd.split()
    if parts[0] == "add":
        inventory.append(parts[1])
    elif parts[0] == "remove":
        inventory.remove(parts[1])
    elif parts[0] == "list":
        print(inventory)
`,

// ══════════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

'fn-01': `\
def say_hello():
    print("Hello!")

say_hello()
`,

'fn-02': `\
def greet(name):
    print("Hello, " + name + "!")

greet("World")
`,

'fn-03': `\
def add(a, b):
    return a + b

print(add(3, 7))
`,

'fn-04': `\
def square(n):
    return n ** 2

print(square(9))
`,

'fn-05': `\
def print_header():
    print("====================")
    print("    CGA PyLab      ")
    print("====================")

print_header()
`,

'fn-06': `\
def is_even(n):
    return n % 2 == 0

print(is_even(4))
print(is_even(7))
`,

'fn-07': `\
def max_of_two(a, b):
    if a > b:
        return a
    else:
        return b

print(max_of_two(5, 8))
print(max_of_two(10, 3))
`,

'fn-08': `\
def to_celsius(f):
    return round((f - 32) * 5 / 9, 1)

print(to_celsius(32))
print(to_celsius(212))
`,

'fn-09': `\
def count_vowels(word):
    count = 0
    for c in word.lower():
        if c in "aeiou":
            count += 1
    return count

print(count_vowels("hello"))
print(count_vowels("rhythm"))
`,

'fn-10': `\
def repeat_string(s, n):
    return s * n

print(repeat_string("ha", 3))
print(repeat_string("py!", 2))
`,

'fn-11': `\
def list_sum(numbers):
    total = 0
    for n in numbers:
        total += n
    return total

print(list_sum([1, 2, 3, 4, 5]))
`,

'fn-12': `\
def is_palindrome(word):
    return word == word[::-1]

print(is_palindrome("racecar"))
print(is_palindrome("hello"))
`,

'fn-13': `\
def clamp(value, min_val, max_val):
    if value < min_val:
        return min_val
    elif value > max_val:
        return max_val
    else:
        return value

print(clamp(5, 1, 10))
print(clamp(-3, 0, 10))
print(clamp(15, 0, 10))
`,

'fn-14': `\
def get_grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"

print(get_grade(95))
print(get_grade(83))
print(get_grade(74))
print(get_grade(61))
print(get_grade(45))
`,

'fn-15': `\
def power(base, exp):
    if exp < 0:
        return 0
    result = 1
    for i in range(exp):
        result *= base
    return result

print(power(2, 10))
print(power(3, 3))
print(power(5, 0))
`,

'fn-16': `\
def print_celsius_scale(start, end, step):
    for c in range(start, end + 1, step):
        f = round(c * 9 / 5 + 32, 1)
        print(str(c) + "\u00b0C = " + str(f) + "\u00b0F")

print_celsius_scale(0, 50, 10)
`,

'fn-17': `\
def caesar_encode(text, shift):
    result = ""
    for ch in text:
        if ch.isalpha():
            result += chr((ord(ch.lower()) - 97 + shift) % 26 + 97)
        else:
            result += ch
    return result

print(caesar_encode("hello", 3))
print(caesar_encode("xyz", 3))
`,

'fn-18': `\
def find_min(lst):
    current_min = lst[0]
    for x in lst[1:]:
        if x < current_min:
            current_min = x
    return current_min

def find_max(lst):
    current_max = lst[0]
    for x in lst[1:]:
        if x > current_max:
            current_max = x
    return current_max

test_list = [3, 1, 4, 1, 5, 9, 2, 6]
print(find_min(test_list))
print(find_max(test_list))
`,

'fn-19': `\
def string_stats(s):
    upper = 0
    lower = 0
    digits = 0
    for c in s:
        if c.isupper():
            upper += 1
        elif c.islower():
            lower += 1
        elif c.isdigit():
            digits += 1
    other = len(s) - upper - lower - digits
    print("Length: " + str(len(s)))
    print("Uppercase: " + str(upper))
    print("Lowercase: " + str(lower))
    print("Digits: " + str(digits))
    print("Other: " + str(other))

string_stats("Hello World 123!")
`,

'fn-20': `\
def to_binary(n):
    if n == 0:
        return "0"
    bits = ""
    while n > 0:
        bits = str(n % 2) + bits
        n = n // 2
    return bits

print(to_binary(10))
print(to_binary(255))
`,

'fn-21': `\
def get_positive_int(prompt):
    while True:
        try:
            value = int(input())
            if value > 0:
                return value
        except:
            pass

age = get_positive_int("Enter age: ")
print(age)
`,

'fn-22': `\
def print_table(n):
    header = " "
    for j in range(1, n + 1):
        header += str(j).rjust(5)
    print(header)
    for i in range(1, n + 1):
        row = str(i)
        for j in range(1, n + 1):
            row += str(i * j).rjust(5)
        print(row)

print_table(4)
`,

};
