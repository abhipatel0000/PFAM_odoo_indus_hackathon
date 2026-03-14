import os
import re

def convert_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Convert require to import
    # const express = require('express'); -> import express from 'express';
    # const model = require('../models/model'); -> import model from '../models/model.js';
    
    def replace_require(match):
        var_name = match.group(1)
        import_path = match.group(2)
        
        # If it's a relative path, add .js if not present
        if import_path.startswith('.'):
            if not import_path.endswith('.js'):
                import_path += '.js'
        
        return f"import {var_name} from '{import_path}';"

    content = re.sub(r"const\s+(\w+)\s*=\s*require\(\s*['\"](.+?)['\"]\s*\);", replace_require, content)

    # Simple require('./something') used for side effects
    def replace_side_effect_require(match):
        import_path = match.group(1)
        if import_path.startswith('.') and not import_path.endswith('.js'):
            import_path += '.js'
        return f"import '{import_path}';"
    
    content = re.sub(r"require\(\s*['\"](.+?)['\"]\s*\);", replace_side_effect_require, content)

    # Convert module.exports to export default
    content = re.sub(r"module\.exports\s*=\s*(\w+);", r"export default \1;", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

backend_dir = r"c:\Users\vyasm\Desktop\test\odoofinal\PFAM_odoo_indus_hackathon\backend"

# Files in models
for root, dirs, files in os.walk(os.path.join(backend_dir, 'models')):
    for file in files:
        if file.endswith('.js'):
            convert_file(os.path.join(root, file))

# Files in routes
for root, dirs, files in os.walk(os.path.join(backend_dir, 'routes')):
    for file in files:
        if file.endswith('.js'):
            convert_file(os.path.join(root, file))

# Files in backend root
for file in ['app.js', 'server.js']:
    filepath = os.path.join(backend_dir, file)
    if os.path.exists(filepath):
        convert_file(filepath)

print("Conversion complete.")
