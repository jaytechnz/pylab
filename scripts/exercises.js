// ─── Python 3 Exercises — Pre-IG Stage 1 ──────────────────────────────────────
// 130+ exercises covering the full scheme of work.
// Each exercise: { id, category, title, difficulty, xp, description, tests, hints, starterCode, inputType }
// inputType: '' | 'int' | 'float' | 'int_float' — enforces int()/float() at input()
// tests: [{ inputs: string[], expected: string[] }]
// expected lines are trimmed and compared case-sensitively.

const XP = { easy: 10, medium: 25, hard: 50 };

function ex(id, cat, title, diff, desc, tests, hints = [], inputType = '') {
  return { id, category: cat, title, difficulty: diff, xp: XP[diff], description: desc, tests, hints, starterCode: '', inputType };
}
function t(inputs, expected) { return { inputs, expected }; }

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY METADATA
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIES = [
  { id: 'variables',  label: 'Variables & I/O',        icon: '📦', count: 22 },
  { id: 'operators',  label: 'Operators & Type Casting',icon: '🔢', count: 20 },
  { id: 'selection',  label: 'Selection (if/elif/else)',icon: '🔀', count: 22 },
  { id: 'iteration',  label: 'Iteration (Loops)',       icon: '🔁', count: 22 },
  { id: 'lists',      label: 'Lists',                   icon: '📋', count: 22 },
  { id: 'functions',  label: 'Functions (def)',          icon: '⚙️', count: 22 },
];

// ══════════════════════════════════════════════════════════════════════════════
// VARIABLES & I/O  (22)
// ══════════════════════════════════════════════════════════════════════════════

export const EXERCISES = [

ex('var-01','variables','Hello, World!','easy',
`Print the message <code>Hello, World!</code> to the screen.`,
[t([],['Hello, World!'])],
['Use the print() function', 'Strings go inside quotation marks']),

ex('var-02','variables','Your Name','easy',
`Assign your first name to a variable called <code>first_name</code> and print it.`,
[t([],['Alice'])],
['Variable names use snake_case', 'Assign with =, then print()']),

ex('var-03','variables','Age Variable','easy',
`Store the integer <code>13</code> in a variable called <code>age</code> and print it.`,
[t([],['13'])],
['int variables store whole numbers', 'No quotes around numbers']),

ex('var-04','variables','Price Variable','easy',
`Store the price <code>4.99</code> in a variable called <code>price</code> and print it.`,
[t([],['4.99'])],
['Use a float for decimal numbers', 'Floats use a decimal point']),

ex('var-05','variables','Boolean Flag','easy',
`Create a variable <code>is_logged_in</code> and assign <code>True</code>. Print it.`,
[t([],['True'])],
['Boolean values are True or False (capital first letter)', 'No quotes around True or False']),

ex('var-06','variables','Multiple Variables','easy',
`Create three variables: <code>subject</code> = <code>"Python"</code>, <code>year</code> = <code>9</code>, <code>score</code> = <code>87.5</code>. Print each on a separate line.`,
[t([],['Python','9','87.5'])],
['Three separate print() calls', 'Or three variables then three prints']),

ex('var-07','variables','Greeting with Input','easy',
`Ask the user for their name with <code>input()</code>. Then print <code>Hello, &lt;name&gt;!</code>`,
[t(['Alice'],['Hello, Alice!']),
 t(['Sam'],['Hello, Sam!'])],
['Store the result of input() in a variable', 'Use string concatenation with + to add the !']),

ex('var-08','variables','String Concatenation','easy',
`Ask for a first name and a last name (two separate inputs). Print the full name on one line, separated by a space.`,
[t(['James','Bond'],['James Bond']),
 t(['Emma','Watson'],['Emma Watson'])],
['Use + to join strings', 'Add a space: first_name + " " + last_name']),

ex('var-09','variables','Repeat a String','easy',
`Assign the string <code>"Python! "</code> to a variable. Print it repeated <code>3</code> times (no newlines between).`,
[t([],['Python! Python! Python! '])],
['In Python, you can multiply a string: "ha" * 3 gives "hahaha"', 'No loop needed — just multiply']),

ex('var-10','variables','Type Check','easy',
`Create one variable of each data type: <code>int</code>, <code>float</code>, <code>str</code>, <code>bool</code>. Print <code>type()</code> of each. The output should be: <code>int</code>, <code>float</code>, <code>str</code>, <code>bool</code> (one per line as shown by type()).`,
[t([],["<class 'int'>","<class 'float'>","<class 'str'>","<class 'bool'>"])],
['type() returns the data type', 'Call print(type(my_variable)) for each']),

ex('var-11','variables','Comment Practice','easy',
`Write a program with:<br>1. A comment that says <code># My first Python program</code><br>2. A variable <code>message</code> set to <code>"Hello from Python!"</code><br>3. Print the variable.`,
[t([],['Hello from Python!'])],
['Comments start with # — Python ignores them', 'Only the print output is tested']),

ex('var-12','variables','Age Input','medium',
`Ask the user: <code>"How old are you? "</code>. Store the answer. Print: <code>You are &lt;age&gt; years old.</code>`,
[t(['15'],['You are 15 years old.']),
 t(['13'],['You are 13 years old.'])],
['input() always returns a string — but here you can keep it as string', 'Use + to build the output string']),

ex('var-13','variables','String Greeting','medium',
`Ask for the user's name and their favourite subject. Print: <code>Hi &lt;name&gt;, I love &lt;subject&gt; too!</code>`,
[t(['Sophie','Maths'],['Hi Sophie, I love Maths too!']),
 t(['Leo','Science'],['Hi Leo, I love Science too!'])],
['Two input() calls needed', 'Use + to join the parts into one string']),

ex('var-14','variables','Two-Line Bio','medium',
`Ask for someone\'s name and age. Print two lines:<br>Line 1: <code>Name: &lt;name&gt;</code><br>Line 2: <code>Age: &lt;age&gt;</code>`,
[t(['Yuna','14'],['Name: Yuna','Age: 14']),
 t(['Max','16'],['Name: Max','Age: 16'])],
['Two input() calls, two print() calls']),

ex('var-15','variables','Swapping Variables','medium',
`Assign <code>first_num = 10</code> and <code>second_num = 20</code>. Swap their values (without using a third variable). Print <code>first_num</code> then <code>second_num</code> — expected output: <code>20</code> then <code>10</code>.`,
[t([],['20','10'])],
['Python allows simultaneous assignment to swap two variables in one line', 'This swaps without a temp variable']),

ex('var-16','variables','Favourite Things','medium',
`Ask the user for: their favourite colour, food, and sport (three inputs). Print all three on ONE line separated by commas, like: <code>blue, pizza, football</code>`,
[t(['blue','pizza','football'],['blue, pizza, football']),
 t(['green','sushi','tennis'],['green, sushi, tennis'])],
['Build the string with + and ", "']),

ex('var-17','variables','Temperature Description','medium',
`Ask for a temperature (as a string). Print: <code>The temperature is &lt;temp&gt; degrees Celsius.</code>`,
[t(['25'],['The temperature is 25 degrees Celsius.']),
 t(['-3'],['The temperature is -3 degrees Celsius.'])],
['No need to convert to int — keep as string for output']),

ex('var-18','variables','Variable Reassignment','medium',
`Start with <code>score = 0</code>. Reassign it to <code>10</code>, then to <code>25</code>. Print the final value.`,
[t([],['25'])],
['Variables can be reassigned with =', 'Only the final value matters']),

ex('var-19','variables','Formatted Receipt','hard',
`Ask for: item name, quantity (int), and price per unit (float). Print a formatted receipt like:<br><code>Item: Apple</code><br><code>Quantity: 3</code><br><code>Price each: 0.5</code><br><code>Total: 1.5</code>`,
[t(['Apple','3','0.5'],['Item: Apple','Quantity: 3','Price each: 0.5','Total: 1.5']),
 t(['Notebook','2','2.99'],['Item: Notebook','Quantity: 2','Price each: 2.99','Total: 5.98'])],
['Convert quantity with int(), price with float()', 'Multiply to get total', 'Use string concatenation for each line'],
'int_float'),

ex('var-20','variables','Mad Libs Story','hard',
`Ask for: a noun, a verb, an adjective, a number (4 inputs). Print the sentence: <code>The &lt;adj&gt; &lt;noun&gt; decided to &lt;verb&gt; exactly &lt;num&gt; times!</code>`,
[t(['cat','jump','fluffy','7'],['The fluffy cat decided to jump exactly 7 times!']),
 t(['robot','dance','shiny','42'],['The shiny robot decided to dance exactly 42 times!'])],
['Four input() calls', 'Build the sentence using string concatenation']),

ex('var-21','variables','Character Profile','hard',
`Create a character profile. Ask for: name, class (e.g. "Warrior"), level (int), health (int). Print in this format:<br><code>=== Character Profile ===</code><br><code>Name: &lt;name&gt;</code><br><code>Class: &lt;class&gt;</code><br><code>Level: &lt;level&gt;</code><br><code>Health: &lt;health&gt; HP</code>`,
[t(['Aragorn','Ranger','15','200'],['=== Character Profile ===','Name: Aragorn','Class: Ranger','Level: 15','Health: 200 HP'])],
['Four inputs (two strings, two ints)', 'Six lines of output'],
'int'),

ex('var-22','variables','Simple Calculator Label','hard',
`Ask for two numbers (as strings) and print: <code>&lt;a&gt; and &lt;b&gt; are your numbers.</code> Then print: <code>Their combined text is: &lt;a&gt;&lt;b&gt;</code> (concatenated, NOT added).`,
[t(['3','4'],['3 and 4 are your numbers.','Their combined text is: 34']),
 t(['10','20'],['10 and 20 are your numbers.','Their combined text is: 1020'])],
['Do NOT convert to int — keep as strings', 'This shows the difference between + on strings vs numbers']),

// ══════════════════════════════════════════════════════════════════════════════
// OPERATORS & TYPE CASTING  (20)
// ══════════════════════════════════════════════════════════════════════════════

ex('ops-01','operators','Addition','easy',
`Ask for two integers. Print their sum.`,
[t(['3','5'],['8']),t(['10','20'],['30'])],
['Use int() to convert input', 'Use + for addition'],
'int'),

ex('ops-02','operators','Subtraction','easy',
`Ask for two integers. Print their difference (first minus second).`,
[t(['10','3'],['7']),t(['50','20'],['30'])],
['Use - for subtraction'],
'int'),

ex('ops-03','operators','Multiplication','easy',
`Ask for two integers. Print their product.`,
[t(['4','5'],['20']),t(['7','8'],['56'])],
['Use * for multiplication'],
'int'),

ex('ops-04','operators','Float Division','easy',
`Ask for two integers. Print the result of dividing the first by the second using regular division (<code>/</code>). The result will be a float.`,
[t(['10','4'],['2.5']),t(['7','2'],['3.5'])],
['Use / for division — this always gives a float in Python 3'],
'int'),

ex('ops-05','operators','Integer Division','easy',
`Ask for two integers. Print the result of <strong>integer (floor) division</strong> using <code>//</code>.`,
[t(['10','3'],['3']),t(['7','2'],['3'])],
['// is integer division — it rounds down (floor)', '10 // 3 = 3 (not 3.33)'],
'int'),

ex('ops-06','operators','Modulus (Remainder)','easy',
`Ask for two integers. Print the <strong>remainder</strong> when the first is divided by the second.`,
[t(['10','3'],['1']),t(['15','4'],['3'])],
['% gives the remainder', '10 % 3 = 1 because 10 = 3×3 + 1'],
'int'),

ex('ops-07','operators','Power / Exponent','easy',
`Ask for a base and an exponent (both integers). Print the result of base to the power of exponent.`,
[t(['2','10'],['1024']),t(['3','3'],['27'])],
['Use ** for exponentiation', '2 ** 10 = 1024'],
'int'),

ex('ops-08','operators','All Three Divisions','medium',
`Ask for two integers a and b. Print three results on separate lines:<br>1. a / b (float division)<br>2. a // b (integer division)<br>3. a % b (modulus)`,
[t(['10','3'],['3.3333333333333335','3','1']),
 t(['17','5'],['3.4','3','2'])],
['Three separate print statements', 'Use /, // and %'],
'int'),

ex('ops-09','operators','Odd or Even Check','medium',
`Ask for an integer. Print <code>True</code> if it is even, <code>False</code> if odd. (Use modulus and comparison.)`,
[t(['4'],['True']),t(['7'],['False']),t(['0'],['True'])],
['A number is even if num % 2 == 0', 'print() will print True or False automatically'],
'int'),

ex('ops-10','operators','Type Cast: str to int','medium',
`Ask the user for their birth year as input. Calculate how old they will be in 2030. Print the result.`,
[t(['2011'],['19']),t(['2008'],['22'])],
['You MUST convert input to int before subtracting', 'age = 2030 - int(input())'],
'int'),

ex('ops-11','operators','String to Float','medium',
`Ask the user for a weight in kg (decimal number). Multiply by <code>2.205</code> to get pounds. Print the result rounded to <strong>2 decimal places</strong>.`,
[t(['70.0'],['154.35']),t(['50.0'],['110.25'])],
['Use float() to convert input', 'Use round(value, 2) to round to 2 decimal places'],
'float'),

ex('ops-12','operators','Number to String','medium',
`Store the integer <code>42</code> in a variable. Convert it to a string and concatenate it with <code>" is the answer!"</code>. Print the result.`,
[t([],['42 is the answer!'])],
['Use str() to convert a number to a string', 'Then use + to concatenate']),

ex('ops-13','operators','Compound Assignment','medium',
`Start with <code>score = 100</code>. Then: add 50, subtract 30, multiply by 2, divide by 3 (integer division), add the modulus of the result divided by 7. Print the final score.`,
[t([],['83'])],
['Use +=, -=, *=, //=, += with %', 'Or do it step by step with separate assignments']),

ex('ops-14','operators','Circle Area','medium',
`Ask for the radius of a circle (as a float). Calculate the area using <code>pi = 3.14159</code>. Print the area rounded to <strong>2 decimal places</strong>.`,
[t(['5'],['78.54']),t(['3'],['28.27'])],
['Area = pi × r²', 'Use ** for squaring: radius ** 2', 'round(area, 2)'],
'float'),

ex('ops-15','operators','Temperature Converter','medium',
`Ask for a temperature in Celsius. Convert to Fahrenheit using: <code>F = C × 9/5 + 32</code>. Print the result (no rounding needed).`,
[t(['0'],['32.0']),t(['100'],['212.0']),t(['37'],['98.6'])],
['Store the celsius value as a float or int', 'Apply the formula, then print'],
'float'),

ex('ops-16','operators','BMI Calculator','hard',
`Ask for weight (kg, float) and height (m, float). Calculate BMI: <code>weight / height²</code>. Print the BMI rounded to <strong>1 decimal place</strong>.`,
[t(['70','1.75'],['22.9']),t(['80','1.80'],['24.7'])],
['BMI = weight / (height ** 2)', 'round(bmi, 1)'],
'float'),

ex('ops-17','operators','Seconds Converter','hard',
`Ask for a number of seconds (integer). Print:<br><code>&lt;h&gt; hours, &lt;m&gt; minutes, &lt;s&gt; seconds</code><br>e.g. 3661 → <code>1 hours, 1 minutes, 1 seconds</code>`,
[t(['3661'],['1 hours, 1 minutes, 1 seconds']),
 t(['7322'],['2 hours, 2 minutes, 2 seconds'])],
['hours = total // 3600', 'remaining = total % 3600', 'minutes = remaining // 60', 'seconds = remaining % 60'],
'int'),

ex('ops-18','operators','Discount Calculator','hard',
`Ask for: original price (float) and discount percentage (int, e.g. 20 for 20%). Calculate the discounted price. Print: <code>Discounted price: &lt;amount&gt;</code> (rounded to 2 decimal places).`,
[t(['100','20'],['Discounted price: 80.0']),
 t(['50','10'],['Discounted price: 45.0'])],
['discount = price * (percent / 100)', 'final = price - discount'],
'int_float'),

ex('ops-19','operators','Hypotenuse','hard',
`Ask for two sides of a right triangle (floats). Calculate the hypotenuse using <code>h = √(a² + b²)</code>. Print it rounded to <strong>2 decimal places</strong>. (Hint: √x = x ** 0.5)`,
[t(['3','4'],['5.0']),t(['5','12'],['13.0'])],
['h = (a**2 + b**2) ** 0.5', 'This is the square root method without importing math'],
'float'),

ex('ops-20','operators','Speed, Distance, Time','hard',
`Ask for distance (km, float) and time (hours, float). Calculate:<br>1. Speed = distance / time (print rounded to 2dp)<br>2. Is the speed over 100? Print <code>True</code> or <code>False</code>.`,
[t(['200','2'],['100.0','False']),t(['300','2.5'],['120.0','True'])],
['speed = distance / time', 'print(speed > 100)'],
'float'),

// ══════════════════════════════════════════════════════════════════════════════
// SELECTION — if / elif / else  (22)
// ══════════════════════════════════════════════════════════════════════════════

ex('sel-01','selection','Pass or Fail','easy',
`Ask for a score (integer 0-100). If it is <code>50</code> or above, print <code>Pass</code>. Otherwise print <code>Fail</code>.`,
[t(['75'],['Pass']),t(['49'],['Fail']),t(['50'],['Pass'])],
['Use if/else', 'The condition is score >= 50'],
'int'),

ex('sel-02','selection','Positive or Negative','easy',
`Ask for an integer. Print <code>Positive</code> if it is greater than 0, <code>Negative</code> if less than 0, or <code>Zero</code> if it equals 0.`,
[t(['5'],['Positive']),t(['-3'],['Negative']),t(['0'],['Zero'])],
['Use if / elif / else — three branches', 'Check for == 0 in the elif or else'],
'int'),

ex('sel-03','selection','Age Category','easy',
`Ask for an age (integer). Print:<br>- <code>Child</code> if under 13<br>- <code>Teenager</code> if 13 to 17 inclusive<br>- <code>Adult</code> if 18 or over`,
[t(['10'],['Child']),t(['15'],['Teenager']),t(['18'],['Adult'])],
['Use if/elif/else with two conditions', 'elif age <= 17 checks the upper bound of teenager'],
'int'),

ex('sel-04','selection','Grade Classifier','easy',
`Ask for a score (int). Print the letter grade:<br>A = 90+, B = 80-89, C = 70-79, D = 60-69, F = below 60.`,
[t(['95'],['A']),t(['82'],['B']),t(['73'],['C']),t(['65'],['D']),t(['50'],['F'])],
['Use if/elif/elif/elif/else', 'Start with the highest: if score >= 90'],
'int'),

ex('sel-05','selection','Even or Odd','easy',
`Ask for an integer. Print <code>Even</code> or <code>Odd</code>.`,
[t(['4'],['Even']),t(['7'],['Odd']),t(['0'],['Even'])],
['Use modulus: if num % 2 == 0'],
'int'),

ex('sel-06','selection','Traffic Light','easy',
`Ask for a traffic light colour (<code>red</code>, <code>amber</code>, or <code>green</code>). Print:<br>- <code>Stop</code> for red<br>- <code>Caution</code> for amber<br>- <code>Go</code> for green<br>- <code>Unknown colour</code> for anything else.`,
[t(['red'],['Stop']),t(['green'],['Go']),t(['amber'],['Caution']),t(['blue'],['Unknown colour'])],
['Use if/elif/elif/else', 'Compare strings with ==']),

ex('sel-07','selection','Maximum of Two','medium',
`Ask for two integers. Print the larger one. If they are equal, print <code>Equal</code>.`,
[t(['5','8'],['8']),t(['10','3'],['10']),t(['6','6'],['Equal'])],
['Use if/elif/else', 'if a > b: ... elif b > a: ... else: ...'],
'int'),

ex('sel-08','selection','Divisibility Check','medium',
`Ask for an integer. Print:<br>- <code>Divisible by both 3 and 5</code><br>- <code>Divisible by 3 only</code><br>- <code>Divisible by 5 only</code><br>- <code>Divisible by neither</code>`,
[t(['15'],['Divisible by both 3 and 5']),t(['9'],['Divisible by 3 only']),t(['10'],['Divisible by 5 only']),t(['7'],['Divisible by neither'])],
['Check both first: if num % 3 == 0 and num % 5 == 0', 'The "both" check must come before the individual checks'],
'int'),

ex('sel-09','selection','Login Check','medium',
`Store <code>correct_password = "python3"</code>. Ask the user to enter a password. If it matches, print <code>Access granted</code>. Otherwise print <code>Access denied</code>.`,
[t(['python3'],['Access granted']),t(['wrong'],['Access denied'])],
['Use == to compare strings']),

ex('sel-10','selection','Leap Year','medium',
`Ask for a year (integer). Print <code>Leap year</code> or <code>Not a leap year</code>.<br>A year is a leap year if: divisible by 4 AND (not divisible by 100 OR divisible by 400).`,
[t(['2024'],['Leap year']),t(['1900'],['Not a leap year']),t(['2000'],['Leap year']),t(['2023'],['Not a leap year'])],
['Condition: (year % 4 == 0) and (year % 100 != 0 or year % 400 == 0)', 'Use and/or for compound conditions'],
'int'),

ex('sel-11','selection','Season Finder','medium',
`Ask for a month number (1-12). Print the season:<br>Dec, Jan, Feb → <code>Winter</code><br>Mar, Apr, May → <code>Spring</code><br>Jun, Jul, Aug → <code>Summer</code><br>Sep, Oct, Nov → <code>Autumn</code>`,
[t(['1'],['Winter']),t(['4'],['Spring']),t(['7'],['Summer']),t(['10'],['Autumn']),t(['12'],['Winter'])],
['Use or to combine months in each condition', 'if month == 12 or month == 1 or month == 2'],
'int'),

ex('sel-12','selection','Calculator','medium',
`Ask for two floats and an operator (<code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>). Perform the operation and print the result. If dividing by zero, print <code>Error: division by zero</code>.`,
[t(['10','3','+'],['13.0']),t(['10','3','-'],['7.0']),t(['4','5','*'],['20.0']),t(['10','2','/'],['5.0']),t(['5','0','/'],['Error: division by zero'])],
['Store the operator as a string', 'Use if/elif to check the operator'],
'float'),

ex('sel-13','selection','Number in Range','medium',
`Ask for a number (int) and check if it is between 1 and 100 inclusive. Print <code>In range</code> or <code>Out of range</code>.`,
[t(['50'],['In range']),t(['100'],['In range']),t(['0'],['Out of range']),t(['101'],['Out of range'])],
['Use and to combine conditions', 'if 1 <= num <= 100 is valid Python!'],
'int'),

ex('sel-14','selection','Ticket Price','medium',
`Ask for age (int). Calculate ticket price:<br>- Under 5: Free (<code>0</code>)<br>- 5-12: £5<br>- 13-17: £8<br>- 18-64: £12<br>- 65+: £6<br>Print: <code>Ticket price: £&lt;price&gt;</code>`,
[t(['4'],['Ticket price: £0']),t(['10'],['Ticket price: £5']),t(['15'],['Ticket price: £8']),t(['30'],['Ticket price: £12']),t(['70'],['Ticket price: £6'])],
['Five branches with if/elif/elif/elif/else', 'Check in order from youngest'],
'int'),

ex('sel-15','selection','Rock Paper Scissors','hard',
`Ask player 1 and player 2 for their choice (<code>rock</code>, <code>paper</code>, or <code>scissors</code>). Print the winner: <code>Player 1 wins</code>, <code>Player 2 wins</code>, or <code>Draw</code>.`,
[t(['rock','scissors'],['Player 1 wins']),t(['paper','rock'],['Player 1 wins']),t(['scissors','paper'],['Player 1 wins']),t(['rock','rock'],['Draw']),t(['scissors','rock'],['Player 2 wins'])],
['Check for draw first: if p1 == p2', 'rock beats scissors, paper beats rock, scissors beats paper']),

ex('sel-16','selection','Grade Point Average','hard',
`Ask for 4 subject scores (integers). Calculate the average. Print the average (1dp) and the letter grade (A≥90, B≥80, C≥70, D≥60, F<60).`,
[t(['85','90','78','82'],['Average: 83.8','Grade: B']),
 t(['90','95','92','88'],['Average: 91.2','Grade: A'])],
['Sum all four scores, divide by 4', 'round(avg, 1)', 'Then check grade with if/elif'],
'int'),

ex('sel-17','selection','Fizz Buzz (Single)','hard',
`Ask for a single integer. Print <code>FizzBuzz</code> if divisible by both 3 and 5, <code>Fizz</code> if only by 3, <code>Buzz</code> if only by 5, or the number itself otherwise.`,
[t(['15'],['FizzBuzz']),t(['9'],['Fizz']),t(['10'],['Buzz']),t(['7'],['7'])],
['Check FizzBuzz first (both conditions)', 'Then Fizz, then Buzz, then else: print the number'],
'int'),

ex('sel-18','selection','Shipping Cost','hard',
`Ask for weight in kg (float). Calculate shipping cost:<br>- ≤1 kg: £3.50<br>- ≤5 kg: £5.00<br>- ≤20 kg: £8.50<br>- >20 kg: £15.00<br>Print: <code>Shipping cost: £&lt;cost&gt;</code>`,
[t(['0.5'],['Shipping cost: £3.5']),t(['3'],['Shipping cost: £5.0']),t(['15'],['Shipping cost: £8.5']),t(['25'],['Shipping cost: £15.0'])],
['Four price tiers — use if/elif/elif/else', 'Check lightest first'],
'float'),

ex('sel-19','selection','Password Strength','hard',
`Ask for a password. Print its strength:<br>- <code>Weak</code> if length < 6<br>- <code>Medium</code> if length 6-11 AND has a digit<br>- <code>Strong</code> if length ≥ 12 OR (length ≥ 8 AND has a digit)<br>Otherwise <code>Medium</code>.`,
[t(['abc'],['Weak']),t(['hello1'],['Medium']),t(['securepass1'],['Strong']),t(['password'],['Medium'])],
['len(password) gives the length', 'any(c.isdigit() for c in password) checks for digits']),

ex('sel-20','selection','Nested IF: Cinema','hard',
`Ask for age (int) and whether the film is rated 15 or above (enter <code>yes</code> or <code>no</code>). Print:<br>- <code>Entry allowed</code> if age >= 15 or film is not 15+<br>- <code>Entry denied: age restriction</code> if rated 15+ and under 15`,
[t(['16','yes'],['Entry allowed']),t(['14','no'],['Entry allowed']),t(['13','yes'],['Entry denied: age restriction']),t(['18','yes'],['Entry allowed'])],
['Use nested if or compound conditions', 'if rated15 == "yes" and age < 15'],
'int'),

ex('sel-21','selection','Day Name','hard',
`Ask for a day number (1=Monday, 7=Sunday). Print the day name. If outside 1-7, print <code>Invalid day number</code>.`,
[t(['1'],['Monday']),t(['5'],['Friday']),t(['7'],['Sunday']),t(['8'],['Invalid day number'])],
['Seven elif branches, one else', 'Or use a list: days = ["Monday", ...]; print(days[num-1])'],
'int'),

ex('sel-22','selection','Number Classifier','hard',
`Ask for an integer. Print ALL that apply (each on a new line):<br>- <code>Positive</code> or <code>Negative</code> or <code>Zero</code><br>- <code>Even</code> or <code>Odd</code><br>- <code>Multiple of 5</code> (if applicable)`,
[t(['10'],['Positive','Even','Multiple of 5']),t(['-7'],['Negative','Odd']),t(['0'],['Zero','Even','Multiple of 5']),t(['3'],['Positive','Odd'])],
['Use separate if statements (not elif) for each independent check', 'Multiple of 5: num % 5 == 0'],
'int'),

// ══════════════════════════════════════════════════════════════════════════════
// ITERATION — for / while  (22)
// ══════════════════════════════════════════════════════════════════════════════

ex('itr-01','iteration','Count to Ten','easy',
`Print the numbers 1 to 10, one per line.`,
[t([],['1','2','3','4','5','6','7','8','9','10'])],
['for i in range(1, 11):', 'range(1, 11) gives 1, 2, 3, ..., 10']),

ex('itr-02','iteration','Count Down','easy',
`Print the numbers 10 down to 1, one per line.`,
[t([],['10','9','8','7','6','5','4','3','2','1'])],
['range(10, 0, -1) counts from 10 down to 1', 'The third argument is the step']),

ex('itr-03','iteration','Five Stars','easy',
`Use a for loop to print <code>*</code> exactly 5 times (one per line).`,
[t([],['*','*','*','*','*'])],
['for i in range(5):', '    print("*")']),

ex('itr-04','iteration','Sum 1 to 100','easy',
`Use a for loop to calculate the sum of all integers from 1 to 100. Print the result.`,
[t([],['5050'])],
['Start with total = 0', 'for i in range(1, 101): total += i']),

ex('itr-05','iteration','Even Numbers','easy',
`Print all even numbers from 2 to 20 inclusive, one per line.`,
[t([],['2','4','6','8','10','12','14','16','18','20'])],
['range(2, 22, 2) gives 2, 4, 6, ..., 20', 'Or range(2, 21, 2) — check which is correct']),

ex('itr-06','iteration','Multiplication Table','easy',
`Ask for a number n (integer). Print its multiplication table from 1 to 10:<br><code>3 x 1 = 3</code><br><code>3 x 2 = 6</code><br>... etc.`,
[t(['5'],['5 x 1 = 5','5 x 2 = 10','5 x 3 = 15','5 x 4 = 20','5 x 5 = 25','5 x 6 = 30','5 x 7 = 35','5 x 8 = 40','5 x 9 = 45','5 x 10 = 50'])],
['for i in range(1, 11):', '    print(str(num) + " x " + str(i) + " = " + str(num*i))'],
'int'),

ex('itr-07','iteration','While: Counting Up','easy',
`Use a <strong>while loop</strong> (not for) to print numbers 1 to 5.`,
[t([],['1','2','3','4','5'])],
['count = 1', 'while count <= 5:', '    print(count)', '    count += 1']),

ex('itr-08','iteration','While: Sum Until Zero','medium',
`Keep asking for integers until the user enters <code>0</code>. Print the total of all entered numbers (not including the 0).`,
[t(['5','3','2','0'],['10']),t(['10','20','0'],['30']),t(['0'],['0'])],
['total = 0', 'while True: ... if num == 0: break', 'Or: num = int(input()); while num != 0: ...'],
'int'),

ex('itr-09','iteration','FizzBuzz (1 to 20)','medium',
`Print FizzBuzz for numbers 1 to 20: <code>Fizz</code> for multiples of 3, <code>Buzz</code> for multiples of 5, <code>FizzBuzz</code> for both, otherwise the number.`,
[t([],['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz','16','17','Fizz','19','Buzz'])],
['for i in range(1, 21):', 'Check FizzBuzz first (divisible by both)', 'Then Fizz, Buzz, or print i']),

ex('itr-10','iteration','Star Triangle','medium',
`Ask for a number n (1-9). Print a right-angled triangle of stars with n rows:<br>Row 1: <code>*</code><br>Row 2: <code>**</code><br>Row n: <code>***...***</code>`,
[t(['4'],['*','**','***','****']),t(['3'],['*','**','***'])],
['for i in range(1, n+1):', '    print("*" * i)'],
'int'),

ex('itr-11','iteration','Sum of Digits','medium',
`Ask for a positive integer. Print the sum of its digits.<br>e.g. 1234 → 10`,
[t(['1234'],['10']),t(['999'],['27']),t(['100'],['1'])],
['Convert to string first: str(n)', 'Then iterate over each character: for d in str(n):', '    total += int(d)'],
'int'),

ex('itr-12','iteration','Number Guessing (Fixed)','medium',
`The secret number is <code>7</code>. Keep reading guesses until the user guesses correctly. For each wrong guess print <code>Wrong!</code>. When correct, print <code>Correct!</code>`,
[t(['3','9','7'],['Wrong!','Wrong!','Correct!']),t(['7'],['Correct!'])],
['while True:', '    guess = int(input())', '    if guess == 7: print("Correct!"); break', '    else: print("Wrong!")'],
'int'),

ex('itr-13','iteration','Average of N Numbers','medium',
`Ask for n (how many numbers). Then ask for n integers. Print their average as a float (no rounding).`,
[t(['3','10','20','30'],['20.0']),t(['4','5','10','15','20'],['12.5'])],
['total = 0; for i in range(n): total += int(input())', 'average = total / n'],
'int'),

ex('itr-14','iteration','Factorial','medium',
`Ask for a non-negative integer n. Calculate n! (factorial) using a loop. Print the result.<br><code>5! = 120</code>`,
[t(['5'],['120']),t(['0'],['1']),t(['7'],['5040'])],
['result = 1; for i in range(1, n+1): result *= i', '0! = 1 (the loop runs 0 times)'],
'int'),

ex('itr-15','iteration','Prime Checker','hard',
`Ask for an integer greater than 1. Print <code>Prime</code> if it is prime, <code>Not prime</code> otherwise.`,
[t(['7'],['Prime']),t(['9'],['Not prime']),t(['2'],['Prime']),t(['1'],['Not prime'])],
['for i in range(2, n): if n % i == 0: not prime', 'Or range(2, int(n**0.5)+1) is more efficient', 'Handle n <= 1 as not prime'],
'int'),

ex('itr-16','iteration','Fibonacci Sequence','hard',
`Ask for n (integer ≥ 1). Print the first n Fibonacci numbers, one per line. Start: 0, 1, 1, 2, 3, 5, ...`,
[t(['6'],['0','1','1','2','3','5']),t(['1'],['0']),t(['8'],['0','1','1','2','3','5','8','13'])],
['prev, curr = 0, 1', 'for _ in range(n): print(prev); prev, curr = curr, prev + curr'],
'int'),

ex('itr-17','iteration','Password Attempts','hard',
`The correct password is <code>"secure99"</code>. Allow up to 3 attempts. After each wrong attempt print <code>Incorrect. Try again.</code> If all 3 fail, print <code>Account locked.</code> If correct, print <code>Welcome!</code>`,
[t(['wrong','wrong','secure99'],['Incorrect. Try again.','Incorrect. Try again.','Welcome!']),
 t(['wrong','wrong','wrong'],['Incorrect. Try again.','Incorrect. Try again.','Incorrect. Try again.','Account locked.'])],
['for attempt in range(3):', '    if correct: print("Welcome!"); break', 'else: print("Account locked.")  # for...else runs if loop completes']),

ex('itr-18','iteration','Cumulative Sum','hard',
`Ask for n integers (n given first). For each integer entered, print the running total so far.`,
[t(['4','10','5','3','2'],['10','15','18','20']),
 t(['3','1','2','3'],['1','3','6'])],
['running_total = 0; for each input: running_total += num; print(running_total)'],
'int'),

ex('itr-19','iteration','Number Pyramid','hard',
`Ask for n (1-9). Print a number pyramid:<br>Row 1: <code>1</code><br>Row 2: <code>1 2</code><br>Row n: <code>1 2 3 ... n</code>`,
[t(['4'],['1','1 2','1 2 3','1 2 3 4']),t(['3'],['1','1 2','1 2 3'])],
['for i in range(1, n+1):', '    print(" ".join(str(j) for j in range(1, i+1)))'],
'int'),

ex('itr-20','iteration','Collatz Conjecture','hard',
`Ask for a positive integer n. Apply the Collatz rule until n = 1: if n is even, halve it; if odd, triple it and add 1. Print each value (not counting the starting n, but including 1). Count and print the number of steps at the end: <code>Steps: &lt;count&gt;</code>`,
[t(['6'],['3','10','5','16','8','4','2','1','Steps: 8']),
 t(['1'],['Steps: 0'])],
['while n != 1: if n % 2 == 0: n = n // 2 else: n = 3 * n + 1; print(n); steps += 1'],
'int'),

ex('itr-21','iteration','Count Vowels','hard',
`Ask for a word (string). Count and print the number of vowels (a, e, i, o, u — case-insensitive).`,
[t(['Hello'],['2']),t(['Python'],['1']),t(['AEIOU'],['5']),t(['gym'],['0'])],
['for char in word.lower():', '    if char in "aeiou": count += 1']),

ex('itr-22','iteration','Reverse a String','hard',
`Ask for a string. Use a <strong>while loop</strong> (not string slicing) to build and print the reversed string.`,
[t(['hello'],['olleh']),t(['Python'],['nohtyP']),t(['racecar'],['racecar'])],
['i = len(s) - 1; result = ""', 'while i >= 0: result += s[i]; i -= 1']),

// ══════════════════════════════════════════════════════════════════════════════
// LISTS  (22)
// ══════════════════════════════════════════════════════════════════════════════

ex('lst-01','lists','Create a List','easy',
`Create a list called <code>fruits</code> containing: <code>"apple"</code>, <code>"banana"</code>, <code>"cherry"</code>. Print the list.`,
[t([],["['apple', 'banana', 'cherry']"])],
['fruits = ["apple", "banana", "cherry"]', 'print(fruits)']),

ex('lst-02','lists','Access by Index','easy',
`Create the list <code>colours = ["red", "green", "blue", "yellow"]</code>. Print the first and last items (using index).`,
[t([],['red','yellow'])],
['Index 0 is first; index -1 is last', 'print(colours[0]) and print(colours[-1])']),

ex('lst-03','lists','List Length','easy',
`Create a list of 5 items (any values). Print the length using <code>len()</code>.`,
[t([],['5'])],
['len(my_list) returns the number of items']),

ex('lst-04','lists','Append to List','easy',
`Start with an empty list called <code>numbers</code>. Append the values 10, 20, 30, 40 one at a time. Print the list.`,
[t([],["[10, 20, 30, 40]"])],
['numbers.append(10)', 'Do this four times, then print']),

ex('lst-05','lists','Loop Through a List','easy',
`Create a list <code>animals = ["cat", "dog", "fish", "bird"]</code>. Use a <code>for</code> loop to print each animal on its own line.`,
[t([],['cat','dog','fish','bird'])],
['for animal in animals:', '    print(animal)']),

ex('lst-06','lists','Sum of a List','easy',
`Create a list of 5 integers. Use a <code>for</code> loop to calculate and print their sum.`,
[t([],['50'])],
['total = 0; for num in my_list: total += num']),

ex('lst-07','lists','User-Built List','medium',
`Ask how many items to add (integer n). Then ask for n strings one by one and store them in a list. Print the list.`,
[t(['3','red','green','blue'],["['red', 'green', 'blue']"]),
 t(['2','yes','no'],["['yes', 'no']"])],
['items = []; for _ in range(n): items.append(input())'],
'int'),

ex('lst-08','lists','Delete by Index','medium',
`Create the list <code>["a", "b", "c", "d", "e"]</code>. Delete the item at index 2 (<code>"c"</code>). Print the resulting list.`,
[t([],["['a', 'b', 'd', 'e']"])],
['del my_list[2] removes the item at index 2', 'Or use my_list.pop(2)']),

ex('lst-09','lists','Remove by Value','medium',
`Create the list <code>[1, 2, 3, 4, 5, 3]</code>. Remove the first occurrence of <code>3</code>. Print the result.`,
[t([],['[1, 2, 4, 5, 3]'])],
['my_list.remove(3) removes the first 3 it finds']),

ex('lst-10','lists','Find Min and Max','medium',
`Ask the user for 5 integers (one per line). Store in a list. Print the minimum and maximum.`,
[t(['3','7','1','9','4'],['1','9']),t(['10','10','10','10','10'],['10','10'])],
['numbers.append(int(input())) five times', 'print(min(numbers))', 'print(max(numbers))'],
'int'),

ex('lst-11','lists','Count Occurrences','medium',
`Ask the user for 6 integers (one per line). Count how many times the value <code>7</code> appears. Print the count.`,
[t(['7','3','7','2','7','5'],['3']),t(['1','2','3','4','5','6'],['0'])],
['numbers.count(7) OR use a for loop with a counter'],
'int'),

ex('lst-12','lists','Reverse a List','medium',
`Create the list <code>[1, 2, 3, 4, 5]</code>. Reverse it (using any method) and print it.`,
[t([],['[5, 4, 3, 2, 1]'])],
['my_list.reverse() reverses in place', 'Or reversed_list = my_list[::-1]']),

ex('lst-13','lists','Shopping List','medium',
`Keep asking the user for items to add to a shopping list. Stop when they type <code>done</code>. Print the final list.`,
[t(['milk','eggs','bread','done'],["['milk', 'eggs', 'bread']"]),
 t(['done'],["[]"])],
['shopping = []; while True: item = input(); if item == "done": break; shopping.append(item)']),

ex('lst-14','lists','Average of List','medium',
`Ask for n (how many numbers). Collect n floats. Print the average rounded to 2 decimal places.`,
[t(['4','10.0','20.0','30.0','40.0'],['25.0']),
 t(['3','1.5','2.5','3.0'],['2.33'])],
['total = sum(numbers) or loop and add', 'average = total / len(numbers)'],
'int_float'),

ex('lst-15','lists','Positive Only','hard',
`Ask for 7 integers (one per line). Create a new list containing only the positive numbers (> 0). Print the new list.`,
[t(['3','-1','5','0','2','-3','8'],['[3, 5, 2, 8]']),
 t(['-1','-2','-3','-4','-5','-6','-7'],['[]'])],
['positives = []; for num in numbers: if num > 0: positives.append(num)'],
'int'),

ex('lst-16','lists','List Search','hard',
`Ask the user for 5 words (one per line) and store in a list. Ask for a search word. Print <code>Found at index &lt;n&gt;</code> or <code>Not found</code>.`,
[t(['cat','dog','fish','bird','frog','dog'],['Found at index 1']),
 t(['a','b','c','d','e','x'],['Not found'])],
['if word in my_list: print("Found at index " + str(my_list.index(word)))', 'else: print("Not found")']),

ex('lst-17','lists','Sort a List','hard',
`Ask for 5 integers (one per line). Sort them in ascending order using <code>.sort()</code>. Print the sorted list. Then print the median (middle value).`,
[t(['3','1','4','1','5'],['[1, 1, 3, 4, 5]','3']),
 t(['9','7','5','3','1'],['[1, 3, 5, 7, 9]','5'])],
['numbers.sort()', 'Median is at index len(numbers)//2 after sorting'],
'int'),

ex('lst-18','lists','Two Lists, One Sum','hard',
`Ask for 4 integers for list A and 4 integers for list B (8 inputs total, 4 then 4). Create a third list C where each element is the sum of the corresponding elements from A and B. Print list C.`,
[t(['1','2','3','4','5','6','7','8'],['[6, 8, 10, 12]']),
 t(['10','20','30','40','1','2','3','4'],['[11, 22, 33, 44]'])],
['for i in range(4): c.append(a[i] + b[i])', 'Or use zip: [x+y for x,y in zip(a,b)]'],
'int'),

ex('lst-19','lists','Remove Duplicates','hard',
`Ask for 6 integers. Remove any duplicates from the list (keep first occurrence). Print the deduplicated list.`,
[t(['1','2','3','2','1','4'],['[1, 2, 3, 4]']),
 t(['5','5','5','5','5','5'],['[5]'])],
['unique = []; for x in lst: if x not in unique: unique.append(x)'],
'int'),

ex('lst-20','lists','High Scores','hard',
`Ask for 5 student names and 5 scores (name then score, alternating). Print the name of the student with the highest score in format: <code>Top student: &lt;name&gt; (&lt;score&gt;)</code>`,
[t(['Alice','85','Bob','92','Carol','78','Dave','91','Eve','88'],['Top student: Bob (92)']),
 t(['X','100','Y','90','Z','80','W','70','V','60'],['Top student: X (100)'])],
['names = []; scores = []; for i in range(5): names.append(input()); scores.append(int(input()))', 'max_score = max(scores); idx = scores.index(max_score)'],
'int'),

ex('lst-21','lists','Flatten Two Lists','hard',
`Create <code>list_a = [1, 3, 5, 7]</code> and <code>list_b = [2, 4, 6, 8]</code>. Combine (concatenate) them and sort the result. Print the sorted combined list.`,
[t([],['[1, 2, 3, 4, 5, 6, 7, 8]'])],
['combined = list_a + list_b', 'combined.sort()', 'print(combined)']),

ex('lst-22','lists','Inventory System','hard',
`Build a simple inventory. Start with <code>inventory = ["sword", "shield", "potion"]</code>.<br>Ask for 3 commands (one per input): <code>add &lt;item&gt;</code>, <code>remove &lt;item&gt;</code>, or <code>list</code>.<br>After all commands, print the final inventory list.`,
[t(['add axe','remove potion','list'],["['sword', 'shield', 'axe']"]),
 t(['list','add helmet','list'],["['sword', 'shield', 'potion']","['sword', 'shield', 'potion', 'helmet']"])],
['cmd.split() splits the command into parts', 'if parts[0] == "add": inventory.append(parts[1])', 'if parts[0] == "remove": inventory.remove(parts[1])', 'if parts[0] == "list": print(inventory)']),

// ══════════════════════════════════════════════════════════════════════════════
// FUNCTIONS — def  (22)
// ══════════════════════════════════════════════════════════════════════════════

ex('fn-01','functions','Hello Function','easy',
`Define a function <code>say_hello()</code> that prints <code>Hello!</code>. Call it once.`,
[t([],['Hello!'])],
['def say_hello():', '    print("Hello!")', 'say_hello()']),

ex('fn-02','functions','Greet by Name','easy',
`Define a function <code>greet(name)</code> that prints <code>Hello, &lt;name&gt;!</code>. Call it with <code>"World"</code>.`,
[t([],['Hello, World!'])],
['def greet(name):', '    print("Hello, " + name + "!")']),

ex('fn-03','functions','Add Two Numbers','easy',
`Define a function <code>add(num1, num2)</code> that <strong>returns</strong> the sum of num1 and num2. Print the result of calling it with 3 and 7.`,
[t([],['10'])],
['def add(num1, num2):', '    return num1 + num2', 'print(add(3, 7))']),

ex('fn-04','functions','Square a Number','easy',
`Define a function <code>square(n)</code> that returns n². Call it with 9 and print the result.`,
[t([],['81'])],
['return n ** 2']),

ex('fn-05','functions','Print Header','easy',
`Define a void function <code>print_header()</code> that prints:<br><code>====================</code><br><code>    CGA PyLab      </code><br><code>====================</code><br>Call it once.`,
[t([],['====================','    CGA PyLab      ','===================='])],
['A void function has no return statement (or return None)', 'Use print() inside the function']),

ex('fn-06','functions','Is Even','easy',
`Define a function <code>is_even(n)</code> that returns <code>True</code> if n is even, <code>False</code> otherwise. Print the result of calling it with 4 and 7.`,
[t([],['True','False'])],
['return n % 2 == 0', 'This expression evaluates to True or False']),

ex('fn-07','functions','Max of Two','medium',
`Define a function <code>max_of_two(a, b)</code> that returns the larger of two numbers. Print results for (5, 8) and (10, 3).`,
[t([],['8','10'])],
['if a > b: return a', 'else: return b']),

ex('fn-08','functions','Fahrenheit to Celsius','medium',
`Define a function <code>to_celsius(f)</code> that converts Fahrenheit to Celsius: <code>C = (F - 32) × 5/9</code>. Round to 1dp. Print results for 32 and 212.`,
[t([],['0.0','100.0'])],
['return round((f - 32) * 5/9, 1)']),

ex('fn-09','functions','Count Vowels in Word','medium',
`Define a function <code>count_vowels(word)</code> that returns the number of vowels. Print results for <code>"hello"</code> and <code>"rhythm"</code>.`,
[t([],['2','0'])],
['return sum(1 for c in word.lower() if c in "aeiou")', 'Or use a for loop']),

ex('fn-10','functions','Repeat a String','medium',
`Define a function <code>repeat_string(s, n)</code> that returns the string s repeated n times. Print results for <code>repeat_string("ha", 3)</code> and <code>repeat_string("py!", 2)</code>.`,
[t([],['hahaha','py!py!'])],
['return s * n']),

ex('fn-11','functions','Sum of List','medium',
`Define a function <code>list_sum(numbers)</code> that returns the sum of a list of numbers (without using the built-in sum()). Test it with <code>[1, 2, 3, 4, 5]</code> and print the result.`,
[t([],['15'])],
['total = 0; for n in numbers: total += n; return total']),

ex('fn-12','functions','Is Palindrome','medium',
`Define a function <code>is_palindrome(word)</code> that returns <code>True</code> if the word reads the same forwards and backwards. Test with <code>"racecar"</code> and <code>"hello"</code>.`,
[t([],['True','False'])],
['return word == word[::-1]', 'Or compare word with reversed(word)']),

ex('fn-13','functions','Clamp a Value','medium',
`Define a function <code>clamp(value, min_val, max_val)</code> that returns:<br>- min_val if value < min_val<br>- max_val if value > max_val<br>- value otherwise.<br>Test: clamp(5, 1, 10) → 5, clamp(-3, 0, 10) → 0, clamp(15, 0, 10) → 10.`,
[t([],['5','0','10'])],
['if value < min_val: return min_val', 'elif value > max_val: return max_val', 'else: return value']),

ex('fn-14','functions','Grade from Score','medium',
`Define a function <code>get_grade(score)</code> that returns a letter grade (A-F). Call it for 95, 83, 74, 61, 45 and print each result.`,
[t([],['A','B','C','D','F'])],
['if score >= 90: return "A"', 'elif score >= 80: return "B" ...']),

ex('fn-15','functions','Power Function','hard',
`Define a function <code>power(base, exp)</code> that calculates base^exp using a loop (NOT the ** operator or pow()). Negative exponents should return 0. Test with (2, 10), (3, 3), (5, 0).`,
[t([],['1024','27','1'])],
['result = 1; for _ in range(exp): result *= base', '5**0 = 1 (zero iterations, result starts at 1)']),

ex('fn-16','functions','Celsius Scale','hard',
`Define a function <code>print_celsius_scale(start, end, step)</code> that prints each temperature in the range and its Fahrenheit equivalent: <code>&lt;C&gt;°C = &lt;F&gt;°F</code> (F rounded to 1dp).<br>Call it with start=0, end=50, step=10.`,
[t([],['0°C = 32.0°F','10°C = 50.0°F','20°C = 68.0°F','30°C = 86.0°F','40°C = 104.0°F','50°C = 122.0°F'])],
['for celsius in range(start, end+1, step):', '    fahrenheit = round(celsius * 9/5 + 32, 1)', '    print(str(celsius) + "°C = " + str(fahrenheit) + "°F")']),

ex('fn-17','functions','Caesar Cipher','hard',
`Define a function <code>caesar_encode(text, shift)</code> that shifts each letter by shift positions (wrapping a-z only; keep other chars unchanged). Call it with <code>caesar_encode("hello", 3)</code> → <code>khoor</code> and <code>caesar_encode("xyz", 3)</code> → <code>abc</code>.`,
[t([],['khoor','abc'])],
['for ch in text: if ch.isalpha(): shifted = chr((ord(ch.lower()) - 97 + shift) % 26 + 97)', 'else: keep ch unchanged']),

ex('fn-18','functions','Min and Max from List','hard',
`Define two functions: <code>find_min(lst)</code> and <code>find_max(lst)</code> — neither may use Python\'s built-in min() or max(). Test both with <code>[3, 1, 4, 1, 5, 9, 2, 6]</code>.`,
[t([],['1','9'])],
['current_min = lst[0]; for x in lst[1:]: if x < current_min: current_min = x']),

ex('fn-19','functions','String Statistics','hard',
`Define a function <code>string_stats(s)</code> that prints:<br>- <code>Length: &lt;n&gt;</code><br>- <code>Uppercase: &lt;n&gt;</code><br>- <code>Lowercase: &lt;n&gt;</code><br>- <code>Digits: &lt;n&gt;</code><br>- <code>Other: &lt;n&gt;</code><br>Call it with <code>"Hello World 123!"</code>.`,
[t([],['Length: 16','Uppercase: 2','Lowercase: 8','Digits: 3','Other: 3'])],
['for ch in s: ch.isupper(), ch.islower(), ch.isdigit()', 'Other = length - upper - lower - digits']),

ex('fn-20','functions','Number Base Converter','hard',
`Define a function <code>to_binary(n)</code> that converts a positive integer to its binary string WITHOUT using Python\'s bin() function. Return the binary string. Test with 10 → "1010" and 255 → "11111111".`,
[t([],['1010','11111111'])],
['while n > 0: bits = str(n % 2) + bits; n = n // 2', 'Build string from remainders in reverse']),

ex('fn-21','functions','Validate Input','hard',
`Define a function <code>get_positive_int(prompt)</code> that keeps asking for input until the user enters a positive integer, then returns it. Use it to ask for age (prompt: <code>"Enter age: "</code>) and print the result.`,
[t(['-1','0','abc','15'],['15']),
 t(['25'],['25'])],
['while True: try int(input(prompt)); if > 0: return; except: ask again', 'Input validation is a key programming skill'],
'int'),

ex('fn-22','functions','Number Table','hard',
`Define a function <code>print_table(n)</code> that prints an n×n multiplication table with column headers aligned (use 4-character-wide fields). First row is headers. Call with n=4.`,
[t([],['     1    2    3    4','1    1    2    3    4','2    2    4    6    8','3    3    6    9   12','4    4    8   12   16'])],
['str(val).rjust(4) right-aligns a number in a 4-char field', 'First row: spaces + "   1   2..."']),

];
