import os
import re

DIR = r"c:\Users\himan\lms\frontend\src\components\admin"

def fix_content(c):
    # Fix the modal container
    c = c.replace('className="bg-white border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"',
                  'className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"')
    
    # Fix the cancel button
    c = c.replace('className="flex-1 px-4 py-2 bg-gray-100 hover:bg-white/20 rounded-lg transition-colors"',
                  'className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"')

    # Fix the close button
    c = c.replace('className="text-gray-600 hover:text-gray-900 transition-colors"',
                  'className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"')
    
    # Fix the submit button
    c = c.replace('className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"',
                  'className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-md"')
    
    # Other common dark mode relics
    c = c.replace('border-white/10', 'border-gray-200')
    c = c.replace('border-white/20', 'border-gray-200')
    c = c.replace('bg-white/5', 'bg-white shadow-sm border border-gray-200 text-gray-900')
    c = c.replace('text-white text-sm focus:border-blue-500/60', 'text-gray-900 text-sm focus:border-blue-500/60')
    
    return c

for f in os.listdir(DIR):
    if f.endswith('.jsx'):
        path = os.path.join(DIR, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_content = fix_content(content)
        
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Fixed {f}")
