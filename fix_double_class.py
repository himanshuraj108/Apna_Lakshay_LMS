import os
import re

ADMIN_PAGES_DIR = r"c:\Users\himan\lms\frontend\src\pages\admin"
ADMIN_COMPONENTS_DIR = r"c:\Users\himan\lms\frontend\src\components\admin"

def process_directory(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Fix double classNames
                # <div className="abc" className="def">
                # We can run it multiple times just in case
                for _ in range(3):
                    content = re.sub(r'className="([^"]+)"\s+className="([^"]+)"', r'className="\1 \2"', content)
                
                # Also fix template literal double classes
                # className={`abc`} className="def"
                for _ in range(3):
                    content = re.sub(r'className=\{`([^`]+)`\}\s+className="([^"]+)"', r'className={`\1 \2`}', content)
                    content = re.sub(r'className="([^"]+)"\s+className=\{`([^`]+)`\}', r'className={`\1 \2`}', content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

process_directory(ADMIN_PAGES_DIR)
process_directory(ADMIN_COMPONENTS_DIR)
print("Double classes fixed!")
