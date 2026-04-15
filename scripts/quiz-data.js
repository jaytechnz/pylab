// ─── Quiz Question Bank ────────────────────────────────────────────────────────
// 150 questions: 50 MC · 50 fill-in-blank · 50 drag-and-drop
// Topics: variables, operators, selection, iteration, lists, functions
// Difficulty: easy · medium · hard  (~50 each)
//
// Drag subtypes:
//   order  → items[] in correct order; display shuffles them
//   match  → pairs:[{term,def}]; defs are shuffled onto right column
//   group  → groups:[{name,items[]}]; all items pooled; student drags to zone

function mc(id, topic, diff, q, options, answer) {
  return { id, type: 'mc', topic, difficulty: diff, q, options, answer };
}
function fill(id, topic, diff, q, blanks) {
  return { id, type: 'fill', topic, difficulty: diff, q, blanks };
}
function drag(id, topic, diff, subtype, q, data) {
  return { id, type: 'drag', topic, difficulty: diff, subtype, q, ...data };
}

export const QUIZ_QUESTIONS = [

  // ══════════════════════════════════════════════════════════════════════════
  // VARIABLES & I/O   (9 MC · 8 fill · 8 drag = 25)
  // ══════════════════════════════════════════════════════════════════════════

  mc('var-mc-01','variables','easy',
    'What does this line do?\n\nage = 16',
    ['Compares age to 16','Prints 16','Stores 16 in a variable called age','Checks if age equals 16'], 2),

  mc('var-mc-02','variables','easy',
    'Which data type stores the text "Python"?',
    ['int','float','bool','str'], 3),

  mc('var-mc-03','variables','easy',
    'What does the print() function do?',
    ['Reads input from the user','Stores a value in memory','Displays output to the screen','Creates a variable'], 2),

  mc('var-mc-04','variables','easy',
    'Which is a valid Python variable name?',
    ['2score','my-name','first_name','class'], 2),

  mc('var-mc-05','variables','easy',
    'What is the data type of the value True?',
    ['str','int','float','bool'], 3),

  mc('var-mc-06','variables','easy',
    'What does input() always return?',
    ['int','float','str','bool'], 2),

  mc('var-mc-07','variables','medium',
    'What will this print?\n\nname = "Alice"\nprint("Hello, " + name)',
    ['Hello, name','Hello, Alice','Hello, "Alice"','Error'], 1),

  mc('var-mc-08','variables','medium',
    'Which line correctly converts user input to an integer?',
    ['age = input(int("Age: "))','age = int(input("Age: "))','age = integer(input("Age: "))','age = input("Age: ", int)'], 1),

  mc('var-mc-09','variables','hard',
    'What is the output?\n\nx = "5"\ny = 3\nprint(x * y)',
    ['15','555','Error: cannot multiply str by int','8'], 1),

  fill('var-fi-01','variables','easy',
    'The ___ function displays output on the screen.',
    ['print']),

  fill('var-fi-02','variables','easy',
    'The input() function always returns a value of type ___.',
    ['str', 'string']),

  fill('var-fi-03','variables','easy',
    'In Python, variable names use ___ to separate words (e.g. first_name).',
    ['underscores', 'an underscore', '_']),

  fill('var-fi-04','variables','medium',
    'Complete the code so x stores an integer read from the user:\n\nx = ___(input("Enter: "))',
    ['int']),

  fill('var-fi-05','variables','medium',
    'Complete the code to print a greeting using concatenation:\n\nname = "Sam"\nprint("Hello, " + ___ + "!")',
    ['name']),

  fill('var-fi-06','variables','medium',
    'The ___ data type stores whole numbers such as 5, -3, and 100.',
    ['int', 'integer']),

  fill('var-fi-07','variables','hard',
    'What does this print? Write the exact output:\n\nx = 10\nprint("Value: " + str(x))',
    ['Value: 10']),

  fill('var-fi-08','variables','hard',
    'Complete the code to print a full name with a space between first and last:\n\nfirst = "John"\nlast  = "Smith"\nprint(first + ___ + last)',
    ['" "', "' '"]),

  drag('var-dr-01','variables','easy','match',
    'Match each Python data type to an example value.',
    { pairs: [
      { term: 'int',   def: '42'      },
      { term: 'float', def: '3.14'    },
      { term: 'str',   def: '"hello"' },
      { term: 'bool',  def: 'True'    },
    ]}),

  drag('var-dr-02','variables','easy','order',
    'Put these lines in the correct order to ask for a name and print a greeting.',
    { items: [
      'name = input("What is your name? ")',
      'print("Nice to meet you, " + name)',
    ]}),

  drag('var-dr-03','variables','easy','group',
    'Sort these into valid and invalid Python variable names.',
    { groups: [
      { name: 'Valid',   items: ['my_score', 'first_name', 'total2'] },
      { name: 'Invalid', items: ['2total', 'my-score', 'for']        },
    ]}),

  drag('var-dr-04','variables','medium','match',
    'Match each function or keyword to its purpose.',
    { pairs: [
      { term: 'print', def: 'Displays output'          },
      { term: 'input', def: 'Reads keyboard input'     },
      { term: 'int',   def: 'Converts to whole number' },
      { term: 'str',   def: 'Converts to text'         },
    ]}),

  drag('var-dr-05','variables','medium','order',
    'Arrange these lines to correctly swap two variables using a temporary variable.',
    { items: [
      'temp = a',
      'a = b',
      'b = temp',
    ]}),

  drag('var-dr-06','variables','medium','group',
    'Sort these values into the correct data type group.',
    { groups: [
      { name: 'int',  items: ['42', '-7', '0']             },
      { name: 'str',  items: ['"hello"', '"42"', '"True"'] },
    ]}),

  drag('var-dr-07','variables','hard','match',
    'Match each conversion expression to its result.',
    { pairs: [
      { term: 'int("5")',     def: '5 (integer)'   },
      { term: 'float("3.2")', def: '3.2 (float)'   },
      { term: 'str(42)',      def: '"42" (string)'  },
      { term: 'int(3.9)',     def: '3 (truncates)'  },
    ]}),

  drag('var-dr-08','variables','hard','order',
    'Arrange these lines to read two names and print the full name.',
    { items: [
      'first = input("First name: ")',
      'last = input("Last name: ")',
      'print(first + " " + last)',
    ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // OPERATORS   (8 MC · 9 fill · 8 drag = 25)
  // ══════════════════════════════════════════════════════════════════════════

  mc('ops-mc-01','operators','easy',
    'What is the result of 10 % 3?',
    ['3','1','0','3.33'], 1),

  mc('ops-mc-02','operators','easy',
    'Which operator performs integer (floor) division?',
    ['//','%','/','**'], 0),

  mc('ops-mc-03','operators','easy',
    'What does the ** operator do?',
    ['Multiply','Modulus','Exponent / power','Floor division'], 2),

  mc('ops-mc-04','operators','easy',
    'What is the value of 2 ** 3?',
    ['6','9','8','5'], 2),

  mc('ops-mc-05','operators','medium',
    'What is the output?\n\nx = 17\nprint(x // 5)',
    ['3.4','3','2','4'], 1),

  mc('ops-mc-06','operators','medium',
    'What is the result of 5 == 5?',
    ['5','True','False','Error'], 1),

  mc('ops-mc-07','operators','medium',
    'Which expression correctly tests if x is not equal to 10?',
    ['x <> 10','x != 10','x =! 10','x ~= 10'], 1),

  mc('ops-mc-08','operators','hard',
    'What is the output?\n\nprint(7 % 2 + 3 ** 2)',
    ['10','12','1','11'], 0),

  fill('ops-fi-01','operators','easy',
    'The ___ operator gives the remainder after dividing two numbers.',
    ['%', 'modulus']),

  fill('ops-fi-02','operators','easy',
    'Complete the expression to raise x to the power of 3:\n\nresult = x ___ 3',
    ['**']),

  fill('ops-fi-03','operators','easy',
    'The comparison operator ___ checks whether two values are equal.',
    ['==']),

  fill('ops-fi-04','operators','medium',
    'What is the value of this expression?\n\n15 // 4',
    ['3']),

  fill('ops-fi-05','operators','medium',
    'Complete the code to calculate the area of a circle:\n\narea = pi ___ radius ** 2',
    ['*']),

  fill('ops-fi-06','operators','medium',
    'What is the output?\n\nx = 10\nx += 3\nprint(x)',
    ['13']),

  fill('ops-fi-07','operators','medium',
    'Complete the code so price stores a decimal number from the user:\n\nprice = ___(input("Enter price: "))',
    ['float']),

  fill('ops-fi-08','operators','hard',
    'What is the output?\n\na = 5\nb = 3\nprint(a > b and b > 0)',
    ['True']),

  fill('ops-fi-09','operators','hard',
    'What is the output?\n\nprint(7 % 2 + 3 ** 2)',
    ['10']),

  drag('ops-dr-01','operators','easy','match',
    'Match each arithmetic operator to its description.',
    { pairs: [
      { term: '+',  def: 'Addition'         },
      { term: '-',  def: 'Subtraction'      },
      { term: '*',  def: 'Multiplication'   },
      { term: '/',  def: 'Division (float)' },
    ]}),

  drag('ops-dr-02','operators','easy','group',
    'Sort these operators into arithmetic and comparison groups.',
    { groups: [
      { name: 'Arithmetic', items: ['+', '-', '*', '//', '**', '%'] },
      { name: 'Comparison', items: ['==', '!=', '<', '>', '<=', '>='] },
    ]}),

  drag('ops-dr-03','operators','medium','order',
    'Arrange these lines to calculate and print total cost (price × quantity).',
    { items: [
      'price = float(input("Price: "))',
      'quantity = int(input("Quantity: "))',
      'total = price * quantity',
      'print("Total:", total)',
    ]}),

  drag('ops-dr-04','operators','medium','match',
    'Match each expression to its value.',
    { pairs: [
      { term: '10 // 3', def: '3'   },
      { term: '10 % 3',  def: '1'   },
      { term: '2 ** 4',  def: '16'  },
      { term: '10 / 4',  def: '2.5' },
    ]}),

  drag('ops-dr-05','operators','medium','group',
    'Sort these conditions as True or False when x = 8.',
    { groups: [
      { name: 'True',  items: ['x > 5', 'x == 8', 'x != 3', 'x >= 8'] },
      { name: 'False', items: ['x < 5', 'x == 7', 'x > 10']            },
    ]}),

  drag('ops-dr-06','operators','hard','order',
    'Arrange these lines to convert total seconds into hours, minutes, and seconds.',
    { items: [
      'total = int(input("Seconds: "))',
      'hours = total // 3600',
      'minutes = (total % 3600) // 60',
      'seconds = total % 60',
      'print(hours, "h", minutes, "m", seconds, "s")',
    ]}),

  drag('ops-dr-07','operators','hard','match',
    'Match each logical expression to its result when a = 5, b = 3.',
    { pairs: [
      { term: 'a > b and b > 0',  def: 'True'  },
      { term: 'a < b or b > 0',   def: 'True'  },
      { term: 'not a == 5',        def: 'False' },
      { term: 'a > 10 and b > 0', def: 'False' },
    ]}),

  drag('ops-dr-08','operators','hard','group',
    'Sort these expressions by their result type.',
    { groups: [
      { name: 'int',   items: ['10 // 3', '5 % 2', '2 ** 3']        },
      { name: 'float', items: ['10 / 3', '3.0 + 2', 'float(5)']     },
      { name: 'bool',  items: ['5 == 5', '3 > 10', '5 != 3']        },
    ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // SELECTION   (8 MC · 8 fill · 9 drag = 25)
  // ══════════════════════════════════════════════════════════════════════════

  mc('sel-mc-01','selection','easy',
    'Which keyword starts a conditional statement in Python?',
    ['when','if','check','select'], 1),

  mc('sel-mc-02','selection','easy',
    'What is required at the end of an if statement line?',
    ['semicolon ;','brackets ()','colon :','nothing'], 2),

  mc('sel-mc-03','selection','easy',
    'Which keyword means "otherwise" in an if/else statement?',
    ['elseif','otherwise','else','elif'], 2),

  mc('sel-mc-04','selection','easy',
    'What will this output?\n\nx = 5\nif x > 3:\n    print("Big")\nelse:\n    print("Small")',
    ['Small','Big','Error','Nothing'], 1),

  mc('sel-mc-05','selection','medium',
    'What does elif stand for?',
    ['else if','else insert','end if','elif is not a real word'], 0),

  mc('sel-mc-06','selection','medium',
    'What is printed?\n\ngrade = 75\nif grade >= 90:\n    print("A")\nelif grade >= 70:\n    print("B")\nelse:\n    print("C")',
    ['A','B','C','Nothing'], 1),

  mc('sel-mc-07','selection','medium',
    'Code inside an if block must be:',
    ['Enclosed in {}','On the same line','Indented (4 spaces)','Followed by end'], 2),

  mc('sel-mc-08','selection','hard',
    'What is printed?\n\nx = 4\nif x > 5:\n    print("A")\nelif x > 2:\n    print("B")\nelif x > 1:\n    print("C")\nelse:\n    print("D")',
    ['A','B','C','D'], 1),

  fill('sel-fi-01','selection','easy',
    'The keyword ___ is used to add a second condition after an if statement.',
    ['elif']),

  fill('sel-fi-02','selection','easy',
    'Complete the condition to check whether score equals 100:\n\nif score ___ 100:\n    print("Perfect!")',
    ['==']),

  fill('sel-fi-03','selection','medium',
    'What will this print?\n\nx = 10\nif x % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")',
    ['Even']),

  fill('sel-fi-04','selection','medium',
    'Complete the condition to check if a number n is positive:\n\nif n ___ 0:\n    print("Positive")',
    ['> 0', '>0']),

  fill('sel-fi-05','selection','medium',
    'Complete the condition using a logical operator to check x is between 1 and 10 inclusive:\n\nif x >= 1 ___ x <= 10:',
    ['and']),

  fill('sel-fi-06','selection','hard',
    'What does this print when mark = 45?\n\nif mark >= 70:\n    print("Pass")\nelif mark >= 50:\n    print("Near")\nelse:\n    print("Fail")',
    ['Fail']),

  fill('sel-fi-07','selection','hard',
    'What is the output when x = 7 and y = 3?\n\nif x > 5 and y < 5:\n    print("Both")\nelif x > 5:\n    print("Only X")\nelse:\n    print("Neither")',
    ['Both']),

  fill('sel-fi-08','selection','hard',
    'Complete the condition to check whether p1 is "rock" and p2 is "scissors":\n\nif p1 == "rock" ___ p2 == "scissors":\n    print("Player 1 wins")',
    ['and']),

  drag('sel-dr-01','selection','easy','order',
    'Arrange the lines to print "Pass" if score ≥ 50, otherwise "Fail".',
    { items: [
      'score = int(input("Score: "))',
      'if score >= 50:',
      '    print("Pass")',
      'else:',
      '    print("Fail")',
    ]}),

  drag('sel-dr-02','selection','easy','match',
    'Match each comparison operator to its meaning.',
    { pairs: [
      { term: '==', def: 'Equal to'              },
      { term: '!=', def: 'Not equal to'          },
      { term: '>=', def: 'Greater than or equal' },
      { term: '<=', def: 'Less than or equal'    },
    ]}),

  drag('sel-dr-03','selection','medium','group',
    'Sort these conditions as True or False when x = 5.',
    { groups: [
      { name: 'True',  items: ['x == 5', 'x >= 5', 'x != 3', 'not x > 10'] },
      { name: 'False', items: ['x != 5', 'x > 5', 'x < 3']                  },
    ]}),

  drag('sel-dr-04','selection','medium','order',
    'Arrange these lines to assign a letter grade: A ≥ 90, B ≥ 70, C otherwise.',
    { items: [
      'if score >= 90:',
      '    print("A")',
      'elif score >= 70:',
      '    print("B")',
      'else:',
      '    print("C")',
    ]}),

  drag('sel-dr-05','selection','medium','match',
    'Match each keyword to its role in conditional logic.',
    { pairs: [
      { term: 'if',   def: 'Tests the first condition'   },
      { term: 'elif', def: 'Tests an additional condition'},
      { term: 'else', def: 'Runs when no condition is met'},
      { term: 'and',  def: 'Both conditions must be True' },
    ]}),

  drag('sel-dr-06','selection','hard','order',
    'Arrange these lines to allow 3 password attempts, printing "Locked" if all fail.',
    { items: [
      'correct = "secret99"',
      'for attempt in range(3):',
      '    pw = input("Password: ")',
      '    if pw == correct:',
      '        print("Welcome!")',
      '        break',
      'else:',
      '    print("Locked")',
    ]}),

  drag('sel-dr-07','selection','hard','group',
    'Sort these into logical operators and comparison operators.',
    { groups: [
      { name: 'Logical',    items: ['and', 'or', 'not']                  },
      { name: 'Comparison', items: ['==', '!=', '<', '>', '<=', '>='] },
    ]}),

  drag('sel-dr-08','selection','hard','order',
    'Arrange these lines to categorise BMI: underweight < 18.5, healthy < 25, overweight otherwise.',
    { items: [
      'bmi = float(input("BMI: "))',
      'if bmi < 18.5:',
      '    print("Underweight")',
      'elif bmi < 25:',
      '    print("Healthy")',
      'else:',
      '    print("Overweight")',
    ]}),

  drag('sel-dr-09','selection','hard','match',
    'Match each expression to True or False when a = 4, b = 7.',
    { pairs: [
      { term: 'a < b and b > 5',  def: 'True'  },
      { term: 'a > b or a == 4',  def: 'True'  },
      { term: 'not (a < b)',       def: 'False' },
      { term: 'a == 4 and b < 5', def: 'False' },
    ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // ITERATION   (9 MC · 8 fill · 8 drag = 25)
  // ══════════════════════════════════════════════════════════════════════════

  mc('itr-mc-01','iteration','easy',
    'What does range(5) produce?',
    ['1, 2, 3, 4, 5','0, 1, 2, 3, 4','0, 1, 2, 3, 4, 5','1, 2, 3, 4'], 1),

  mc('itr-mc-02','iteration','easy',
    'Which loop type is best when you know exactly how many times to iterate?',
    ['while','for','repeat','loop'], 1),

  mc('itr-mc-03','iteration','easy',
    'How many times does this loop body run?\n\nfor i in range(3):\n    print(i)',
    ['2','4','3','1'], 2),

  mc('itr-mc-04','iteration','easy',
    'Which keyword exits a loop immediately?',
    ['stop','end','exit','break'], 3),

  mc('itr-mc-05','iteration','easy',
    'What is the output?\n\nfor i in range(1, 4):\n    print(i)',
    ['0 1 2 3','1 2 3 4','1 2 3','0 1 2'], 2),

  mc('itr-mc-06','iteration','medium',
    'What is the output?\n\ncount = 0\nwhile count < 3:\n    count += 1\nprint(count)',
    ['0','2','3','4'], 2),

  mc('itr-mc-07','iteration','medium',
    'Which loop type is most appropriate when the number of iterations is unknown?',
    ['for loop','while loop','do-while loop','range loop'], 1),

  mc('itr-mc-08','iteration','medium',
    'What does range(2, 10, 2) produce?',
    ['2, 4, 6, 8, 10','2, 4, 6, 8','0, 2, 4, 6, 8','2, 3, 4, 5, 6, 7, 8, 9'], 1),

  mc('itr-mc-09','iteration','hard',
    'What is the output?\n\nfor i in range(1, 6):\n    if i % 2 == 0:\n        print(i)',
    ['1 3 5','2 4','1 2 3 4 5','2 4 6'], 1),

  fill('itr-fi-01','iteration','easy',
    'Complete the for loop to print numbers 1 to 5:\n\nfor i in range(___, 6):\n    print(i)',
    ['1']),

  fill('itr-fi-02','iteration','easy',
    'A ___ loop repeats while a condition is True.',
    ['while']),

  fill('itr-fi-03','iteration','medium',
    'What is the output?\n\ntotal = 0\nfor i in range(1, 4):\n    total += i\nprint(total)',
    ['6']),

  fill('itr-fi-04','iteration','medium',
    'Complete the while loop to count down from 5 to 1:\n\nn = 5\nwhile n ___ 0:\n    print(n)\n    n -= 1',
    ['> 0', '>0']),

  fill('itr-fi-05','iteration','medium',
    'The ___ keyword skips the rest of the current iteration and moves to the next.',
    ['continue']),

  fill('itr-fi-06','iteration','hard',
    'What does range(0, 20, 5) produce? Write all values separated by spaces.',
    ['0 5 10 15']),

  fill('itr-fi-07','iteration','hard',
    'Complete the loop to print only odd numbers from 1 to 9:\n\nfor i in range(1, 10, ___):\n    print(i)',
    ['2']),

  fill('itr-fi-08','iteration','hard',
    'What is the output? (The loop uses a for-else construct.)\n\nfor i in range(3):\n    if i == 5:\n        break\nelse:\n    print("Done")',
    ['Done']),

  drag('itr-dr-01','iteration','easy','match',
    'Match each range() call to the sequence it produces.',
    { pairs: [
      { term: 'range(3)',        def: '0, 1, 2'    },
      { term: 'range(1, 4)',     def: '1, 2, 3'    },
      { term: 'range(0, 6, 2)', def: '0, 2, 4'    },
      { term: 'range(5, 1, -1)',def: '5, 4, 3, 2' },
    ]}),

  drag('itr-dr-02','iteration','easy','order',
    'Arrange these lines to print the numbers 1 to 5 using a for loop.',
    { items: [
      'for i in range(1, 6):',
      '    print(i)',
    ]}),

  drag('itr-dr-03','iteration','medium','order',
    'Arrange these lines to sum all numbers from 1 to 10 and print the total.',
    { items: [
      'total = 0',
      'for i in range(1, 11):',
      '    total += i',
      'print(total)',
    ]}),

  drag('itr-dr-04','iteration','medium','group',
    'Sort each scenario into the most appropriate loop type.',
    { groups: [
      { name: 'for loop',   items: ['Print 1 to 10', 'Loop through a list', 'Repeat exactly 7 times'] },
      { name: 'while loop', items: ['Repeat until user types "quit"', 'Loop while balance > 0', 'Keep asking until valid input'] },
    ]}),

  drag('itr-dr-05','iteration','medium','order',
    'Arrange these lines to print the multiplication table for 3 (3×1 to 3×5).',
    { items: [
      'for i in range(1, 6):',
      '    result = 3 * i',
      '    print("3 x " + str(i) + " = " + str(result))',
    ]}),

  drag('itr-dr-06','iteration','hard','order',
    'Arrange these lines to check whether a number is prime.',
    { items: [
      'n = int(input("Number: "))',
      'is_prime = True',
      'for i in range(2, n):',
      '    if n % i == 0:',
      '        is_prime = False',
      '        break',
      'if is_prime:',
      '    print("Prime")',
      'else:',
      '    print("Not prime")',
    ]}),

  drag('itr-dr-07','iteration','hard','match',
    'Match each loop keyword to its purpose.',
    { pairs: [
      { term: 'break',    def: 'Exit the loop immediately'          },
      { term: 'continue', def: 'Skip to the next iteration'         },
      { term: 'else',     def: 'Runs after the loop completes normally'},
      { term: 'range',    def: 'Generates a sequence of numbers'    },
    ]}),

  drag('itr-dr-08','iteration','hard','group',
    'Sort these into "for loop only", "while loop only", or "both".',
    { groups: [
      { name: 'for only',   items: ['Uses range()', 'Iterates over a sequence']              },
      { name: 'while only', items: ['Needs a condition to be True', 'Risks an infinite loop']},
      { name: 'both',       items: ['Can use break', 'Can use continue', 'Can be nested']    },
    ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // LISTS   (8 MC · 9 fill · 8 drag = 25)
  // ══════════════════════════════════════════════════════════════════════════

  mc('lst-mc-01','lists','easy',
    'How do you create an empty list in Python?',
    ['mylist = {}','mylist = ()','mylist = []','mylist = ""'], 2),

  mc('lst-mc-02','lists','easy',
    'What does len(["a", "b", "c"]) return?',
    ['2','3','4','1'], 1),

  mc('lst-mc-03','lists','easy',
    'Which method adds an item to the end of a list?',
    ['add()','insert()','append()','push()'], 2),

  mc('lst-mc-04','lists','easy',
    'What is the index of the first element in a list?',
    ['1','0','-1','None'], 1),

  mc('lst-mc-05','lists','easy',
    'What does fruits[-1] return for fruits = ["apple", "banana", "cherry"]?',
    ['"apple"','"banana"','"cherry"','Error'], 2),

  mc('lst-mc-06','lists','medium',
    'What is the output?\n\nnums = [10, 20, 30]\nnums.append(40)\nprint(len(nums))',
    ['3','4','5','Error'], 1),

  mc('lst-mc-07','lists','medium',
    'What is the output?\n\ncolours = ["red", "green", "blue"]\nprint(colours[1])',
    ['"red"','"green"','"blue"','Error'], 1),

  mc('lst-mc-08','lists','hard',
    'What is the output?\n\nwords = ["cat", "dog", "bird"]\nwords[1] = "fish"\nprint(words)',
    ["['cat', 'dog', 'bird']","['cat', 'fish', 'bird']","['fish', 'dog', 'bird']",'Error'], 1),

  fill('lst-fi-01','lists','easy',
    'To add "orange" to the end of the list fruits, use:\n\nfruits.___("orange")',
    ['append']),

  fill('lst-fi-02','lists','easy',
    'To get the number of items in a list called scores, use ___(scores).',
    ['len']),

  fill('lst-fi-03','lists','easy',
    'The index of the first element in any Python list is ___.',
    ['0']),

  fill('lst-fi-04','lists','medium',
    'Complete the code to loop through every item in a list called items:\n\nfor item in ___:\n    print(item)',
    ['items']),

  fill('lst-fi-05','lists','medium',
    'What is the output?\n\ndata = [5, 3, 8, 1]\ndata.sort()\nprint(data[0])',
    ['1']),

  fill('lst-fi-06','lists','medium',
    'Complete the code to remove "banana" from the list:\n\nfruits = ["apple", "banana", "cherry"]\nfruits.___("banana")',
    ['remove']),

  fill('lst-fi-07','lists','hard',
    'What is the output?\n\nnums = [3, 1, 4, 1, 5]\nprint(nums[2])',
    ['4']),

  fill('lst-fi-08','lists','hard',
    'Complete the code to build a list of squares from 1 to 5:\n\nsquares = []\nfor i in range(1, 6):\n    squares.___(i ** 2)',
    ['append']),

  fill('lst-fi-09','lists','hard',
    'What is the output?\n\nnums = [10, 20, 30]\nnums.pop()\nprint(nums)',
    ['[10, 20]']),

  drag('lst-dr-01','lists','easy','match',
    'Match each list operation to its description.',
    { pairs: [
      { term: 'append(x)',  def: 'Add x to the end'            },
      { term: 'remove(x)',  def: 'Remove first occurrence of x' },
      { term: 'len(list)',  def: 'Return number of items'       },
      { term: 'list[0]',    def: 'Access the first element'     },
    ]}),

  drag('lst-dr-02','lists','easy','order',
    'Arrange these lines to create a list of 3 names and print each one.',
    { items: [
      'names = ["Alice", "Ben", "Chloe"]',
      'for name in names:',
      '    print(name)',
    ]}),

  drag('lst-dr-03','lists','medium','order',
    'Arrange these lines to build a list of even numbers from 2 to 10.',
    { items: [
      'evens = []',
      'for i in range(2, 11, 2):',
      '    evens.append(i)',
      'print(evens)',
    ]}),

  drag('lst-dr-04','lists','medium','group',
    'Sort these list methods into "modifies the list" or "does not modify the list".',
    { groups: [
      { name: 'Modifies',        items: ['append()', 'remove()', 'sort()', 'reverse()'] },
      { name: 'Does not modify', items: ['len()', 'index()', 'count()']                 },
    ]}),

  drag('lst-dr-05','lists','medium','match',
    'Match each index expression to the value it returns.\n\ncolours = ["red", "green", "blue", "yellow"]',
    { pairs: [
      { term: 'colours[0]',  def: '"red"'    },
      { term: 'colours[2]',  def: '"blue"'   },
      { term: 'colours[-1]', def: '"yellow"' },
      { term: 'colours[1]',  def: '"green"'  },
    ]}),

  drag('lst-dr-06','lists','hard','order',
    'Arrange these lines to find the largest number in a list without using max().',
    { items: [
      'nums = [3, 7, 2, 9, 1]',
      'largest = nums[0]',
      'for n in nums:',
      '    if n > largest:',
      '        largest = n',
      'print(largest)',
    ]}),

  drag('lst-dr-07','lists','hard','group',
    'Sort these list operations by whether they use an index.',
    { groups: [
      { name: 'Uses an index',      items: ['list[0]', 'list[-1]', 'list[2] = 5', 'del list[1]']          },
      { name: 'Does not use index', items: ['list.append(x)', 'list.remove(x)', 'len(list)', 'list.sort()'] },
    ]}),

  drag('lst-dr-08','lists','hard','order',
    'Arrange these lines to count how many times the value 2 appears in a list.',
    { items: [
      'data = [1, 2, 3, 2, 1, 2]',
      'count = 0',
      'for item in data:',
      '    if item == 2:',
      '        count += 1',
      'print(count)',
    ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // FUNCTIONS   (8 MC · 8 fill · 9 drag = 25)
  // ══════════════════════════════════════════════════════════════════════════

  mc('fn-mc-01','functions','easy',
    'Which keyword is used to define a function in Python?',
    ['function','fun','def','define'], 2),

  mc('fn-mc-02','functions','easy',
    'Which keyword sends a value back from a function?',
    ['output','send','give','return'], 3),

  mc('fn-mc-03','functions','easy',
    'What is printed?\n\ndef greet():\n    print("Hello!")\n\ngreet()',
    ['greet()','Nothing','Hello!','Error'], 2),

  mc('fn-mc-04','functions','easy',
    'A function that does NOT return a value is sometimes called a:',
    ['method','void function (procedure)','return function','empty function'], 1),

  mc('fn-mc-05','functions','medium',
    'What is the output?\n\ndef add(a, b):\n    return a + b\n\nprint(add(3, 4))',
    ['3','4','7','add(3, 4)'], 2),

  mc('fn-mc-06','functions','medium',
    'What is the output?\n\ndef double(x):\n    return x * 2\n\nresult = double(5)\nprint(result)',
    ['5','10','double(5)','Error'], 1),

  mc('fn-mc-07','functions','hard',
    'A function parameter is:',
    ['The value returned by a function','A variable in the function definition that receives an argument','A call to another function','The same as a global variable'], 1),

  mc('fn-mc-08','functions','hard',
    'What is the output?\n\ndef mystery(n):\n    total = 0\n    for i in range(1, n + 1):\n        total += i\n    return total\n\nprint(mystery(4))',
    ['4','10','6','Error'], 1),

  fill('fn-fi-01','functions','easy',
    'To define a function called greet, start with:\n\n___ greet():',
    ['def']),

  fill('fn-fi-02','functions','easy',
    'The ___ keyword sends a value back to the caller of a function.',
    ['return']),

  fill('fn-fi-03','functions','medium',
    'Complete the function to return the square of a number:\n\ndef square(n):\n    return n ___ 2',
    ['** 2', '**2', '**']),

  fill('fn-fi-04','functions','medium',
    'What is the output?\n\ndef greet(name):\n    print("Hi, " + name + "!")\n\ngreet("Ava")',
    ['Hi, Ava!']),

  fill('fn-fi-05','functions','medium',
    'A function definition line must end with a ___.',
    [':']),

  fill('fn-fi-06','functions','hard',
    'What is the output?\n\ndef max_val(a, b):\n    if a > b:\n        return a\n    return b\n\nprint(max_val(8, 12))',
    ['12']),

  fill('fn-fi-07','functions','hard',
    'Complete the function that returns the factorial of n:\n\ndef factorial(n):\n    result = 1\n    for i in range(1, ___ + 1):\n        result *= i\n    return result',
    ['n']),

  fill('fn-fi-08','functions','hard',
    'What is the output?\n\ndef count_down(n):\n    while n > 0:\n        print(n)\n        n -= 1\n\ncount_down(3)',
    ['3\n2\n1', '3 2 1']),

  drag('fn-dr-01','functions','easy','match',
    'Match each term to its description.',
    { pairs: [
      { term: 'def',       def: 'Keyword to define a function'     },
      { term: 'parameter', def: 'Variable that receives an argument'},
      { term: 'return',    def: 'Sends a value back to the caller'  },
      { term: 'call',      def: 'Executes the function'             },
    ]}),

  drag('fn-dr-02','functions','easy','order',
    'Arrange these lines to define and call a function that prints a greeting.',
    { items: [
      'def greet(name):',
      '    print("Hello, " + name + "!")',
      'greet("Alice")',
    ]}),

  drag('fn-dr-03','functions','medium','order',
    'Arrange these lines to define a function that returns the larger of two numbers.',
    { items: [
      'def larger(a, b):',
      '    if a > b:',
      '        return a',
      '    return b',
      'print(larger(5, 9))',
    ]}),

  drag('fn-dr-04','functions','medium','group',
    'Sort these into "void function" (no return) and "value-returning function".',
    { groups: [
      { name: 'Void (procedure)',  items: ['def print_header():\n    print("===")', 'def display(x):\n    print(x)']    },
      { name: 'Returns a value',   items: ['def add(a, b):\n    return a + b', 'def square(n):\n    return n ** 2'] },
    ]}),

  drag('fn-dr-05','functions','medium','match',
    'Match each built-in function call to its return value.',
    { pairs: [
      { term: 'len("hello")', def: '5' },
      { term: 'abs(-7)',      def: '7' },
      { term: 'max(3, 7, 2)',def: '7' },
      { term: 'round(3.7)',   def: '4' },
    ]}),

  drag('fn-dr-06','functions','hard','order',
    'Arrange these lines to define a Celsius-to-Fahrenheit converter and call it.',
    { items: [
      'def celsius_to_f(c):',
      '    return c * 9 / 5 + 32',
      'temp = float(input("Celsius: "))',
      'print(celsius_to_f(temp))',
    ]}),

  drag('fn-dr-07','functions','hard','order',
    'Arrange these lines to define a function that checks if a number is even, then use it.',
    { items: [
      'def is_even(n):',
      '    return n % 2 == 0',
      'num = int(input("Number: "))',
      'if is_even(num):',
      '    print("Even")',
      'else:',
      '    print("Odd")',
    ]}),

  drag('fn-dr-08','functions','hard','group',
    'Sort these concepts into "function definition" or "function call".',
    { groups: [
      { name: 'Definition', items: ['def add(a, b):', 'return result', 'parameters in ()'] },
      { name: 'Call',       items: ['add(3, 4)', 'result = square(5)', 'arguments in ()']  },
    ]}),

  drag('fn-dr-09','functions','hard','match',
    'Match each term to its definition.',
    { pairs: [
      { term: 'argument',     def: 'Value passed when calling a function'      },
      { term: 'parameter',    def: 'Variable in the function definition'        },
      { term: 'return value', def: 'Data sent back to the caller'               },
      { term: 'scope',        def: 'The region where a variable can be accessed'},
    ]}),
];
