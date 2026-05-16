import re, os

FILES = [
    r"c:\Users\himan\lms\backend\controllers\studentController.js",
    r"c:\Users\himan\lms\backend\controllers\authController.js",
]

# Pattern: Seat.findOne({ 'assignments.student': X, 'assignments.status': 'active' })
# Replace with: Seat.findOne({ assignments: { $elemMatch: { student: X, status: 'active' } } })

# We'll use a multiline regex to match the two-condition block
PATTERN = re.compile(
    r"Seat\.findOne\(\{\s*'assignments\.student':\s*([\w.]+),\s*'assignments\.status':\s*'active'\s*\}\)",
    re.MULTILINE
)

def replacement(m):
    student_var = m.group(1)
    return f"Seat.findOne({{ assignments: {{ $elemMatch: {{ student: {student_var}, status: 'active' }} }} }})"

for filepath in FILES:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = PATTERN.sub(replacement, content)
    
    count = len(PATTERN.findall(content))
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {count} queries in {os.path.basename(filepath)}")
    else:
        print(f"No matches in {os.path.basename(filepath)}")

print("Done!")
