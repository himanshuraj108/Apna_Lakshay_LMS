import os
import re

ADMIN_PAGES_DIR = r"c:\Users\himan\lms\frontend\src\pages\admin"
ADMIN_COMPONENTS_DIR = r"c:\Users\himan\lms\frontend\src\components\admin"

def fix_classes_string(cls_str):
    original_cls_str = cls_str
    
    # Simple replacements
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
    
    # Special glass backgrounds inline
    cls_str = cls_str.replace('rgba(10,10,16,0.98)', 'rgba(255,255,255,0.98)')
    cls_str = cls_str.replace('rgba(255,255,255,0.08)', 'rgba(0,0,0,0.08)')
    
    # Text-white logic
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

def process_content(content):
    # Process className="..."
    content = re.sub(r'className="([^"]+)"', fix_classes, content)
    
    # Process className={`...`}
    content = re.sub(r'className=\{`([^`]+)`\}', fix_template_classes, content)
    
    # 1. Backgrounds styles
    content = re.sub(r'style=\{\{\s*background:\s*[\'"]#050508[\'"]\s*\}\}', 'className="bg-gray-50"', content)
    content = re.sub(r'style=\{\{\s*background:\s*[\'"]#0a0a10[\'"]\s*\}\}', 'className="bg-white"', content)
    content = re.sub(r'style=\{\{\s*backgroundColor:\s*[\'"]#050508[\'"]\s*\}\}', 'className="bg-gray-50"', content)
    
    # 4. Glass CSS (in AdminDashboard and others)
    glass_dark = r'background:linear-gradient\(135deg,rgba\(255,255,255,0\.04\),rgba\(255,255,255,0\.01\)\);backdrop-filter:blur\(20px\);border:1px solid rgba\(255,255,255,0\.07\);'
    glass_light = r'background:rgba(255,255,255,0.7);backdrop-filter:blur(20px);border:1px solid rgba(0,0,0,0.1);box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);'
    content = re.sub(glass_dark, glass_light, content)
    
    glass_hover_dark = r'background:linear-gradient\(135deg,rgba\(255,255,255,0\.07\),rgba\(255,255,255,0\.02\)\);border-color:rgba\(255,255,255,0\.12\);'
    glass_hover_light = r'background:rgba(255,255,255,0.9);border-color:rgba(0,0,0,0.2);'
    content = re.sub(glass_hover_dark, glass_hover_light, content)

    # 5. Background Orbs
    orb1_dark = r'bg-purple-600/8'
    orb1_light = r'bg-purple-300/30'
    content = re.sub(orb1_dark, orb1_light, content)
    
    orb2_dark = r'bg-blue-600/8'
    orb2_light = r'bg-blue-300/30'
    content = re.sub(orb2_dark, orb2_light, content)
    
    grid_dark = r'radial-gradient\(circle at 1px 1px, rgba\(255,255,255,0\.025\) 1px, transparent 0\)'
    grid_light = r'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)'
    content = re.sub(grid_dark, grid_light, content)
    
    return content

def process_directory(directory):
    for root, _, files in os.walk(directory):
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

process_directory(ADMIN_PAGES_DIR)
process_directory(ADMIN_COMPONENTS_DIR)
print("Done!")
