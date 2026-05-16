import os
import re

DIR = r"c:\Users\himan\lms\frontend\src\components\admin"

def process_content(content):
    # 1. Constants
    content = content.replace("const PAGE_BG = { background: '#050508' };", "const PAGE_BG = { background: '#F8FAFC' };")
    
    content = content.replace("const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder-gray-700';", 
                              "const INPUT = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:border-blue-500/50 outline-none transition-all placeholder-gray-400 shadow-sm';")
                              
    content = content.replace("const BTN_SECONDARY = 'px-4 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 font-medium transition-all disabled:opacity-50';",
                              "const BTN_SECONDARY = 'px-4 py-2.5 rounded-xl text-sm text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 font-medium transition-all disabled:opacity-50 shadow-sm';")

    content = content.replace("const BTN_PRIMARY = 'px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all';",
                              "const BTN_PRIMARY = 'px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]';")

    content = content.replace("const BTN_DANGER = 'px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all';",
                              "const BTN_DANGER = 'px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]';")

    # 2. Re-run class fixes but universally over the whole file (safely)
    # Be careful not to replace text-white everywhere.
    
    # We will do className regex replacement to catch all remaining classes
    def fix_classes_string(cls_str):
        original_cls_str = cls_str
        
        cls_str = cls_str.replace('bg-gray-900', 'bg-white')
        cls_str = cls_str.replace('bg-gray-800', 'bg-gray-50')
        cls_str = cls_str.replace('bg-[#0a0a10]', 'bg-white')
        cls_str = cls_str.replace('bg-[#050508]', 'bg-gray-50')
        cls_str = cls_str.replace('bg-white/5', 'bg-gray-50')
        cls_str = cls_str.replace('bg-white/10', 'bg-gray-100')
        cls_str = cls_str.replace('border-white/10', 'border-gray-200')
        cls_str = cls_str.replace('border-white/5', 'border-gray-100')
        cls_str = cls_str.replace('border-gray-800', 'border-gray-200')
        cls_str = cls_str.replace('border-gray-700', 'border-gray-300')
        cls_str = cls_str.replace('text-gray-400', 'text-gray-600')
        cls_str = cls_str.replace('text-gray-300', 'text-gray-700')
        
        # text-white logic
        if 'text-white' in cls_str:
            has_primary_bg = re.search(r'bg-(blue|red|green|yellow|indigo|purple|pink|orange|teal|emerald|cyan|rose|amber|fuchsia|violet)-[4567]00', cls_str)
            has_gradient = 'from-' in cls_str and 'to-' in cls_str
            has_black_bg = 'bg-black' in cls_str or 'bg-gray-900' in original_cls_str
            
            if not (has_primary_bg or has_gradient or has_black_bg):
                cls_str = cls_str.replace('text-white', 'text-gray-900')

        return cls_str

    def fix_classes(match):
        return 'className="' + fix_classes_string(match.group(1)) + '"'

    def fix_template_classes(match):
        return 'className={`' + fix_classes_string(match.group(1)) + '`}'

    # Process className="..."
    content = re.sub(r'className="([^"]+)"', fix_classes, content)
    
    # Process className={`...`}
    content = re.sub(r'className=\{`([^`]+)`\}', fix_template_classes, content)

    # 3. Handle Glass backgrounds inline 
    glass_dark = r'background:\s*[\'"`]linear-gradient\(135deg,\s*rgba\(255,255,255,0\.04\),\s*rgba\(255,255,255,0\.01\)\)[\'"`]\s*,\s*backdropFilter:\s*[\'"`]blur\(20px\)[\'"`]\s*,\s*border:\s*[\'"`]1px solid rgba\(255,255,255,0\.07\)[\'"`]'
    glass_light = r"background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'"
    content = re.sub(glass_dark, glass_light, content)
    
    # Some string literal style usages
    content = re.sub(r'style=\{\{\s*background:\s*[\'"]#050508[\'"]\s*\}\}', 'className="bg-gray-50"', content)
    content = re.sub(r'style=\{\{\s*background:\s*[\'"]#0a0a10[\'"]\s*\}\}', 'className="bg-white"', content)
    content = re.sub(r'style=\{\{\s*backgroundColor:\s*[\'"]#050508[\'"]\s*\}\}', 'className="bg-gray-50"', content)

    return content

for root, _, files in os.walk(DIR):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = process_content(content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file}")

print("Done v2")
