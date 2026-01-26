const fs = require('fs');
const path = require('path');

// Paths
const controllerPath = path.join(__dirname, '../controllers/adminController.js');
const routesPath = path.join(__dirname, '../routes/adminRoutes.js');

// 1. Get Exports from Controller
const controllerContent = fs.readFileSync(controllerPath, 'utf8');
const exportRegex = /exports\.([a-zA-Z0-9_]+)\s*=/g;
const exportsList = [];
let match;
while ((match = exportRegex.exec(controllerContent)) !== null) {
    exportsList.push(match[1]);
}

console.log(`Found ${exportsList.length} exports in adminController.js`);

// 2. Get Imports from Routes
const routesContent = fs.readFileSync(routesPath, 'utf8');
// Look for } = require('../controllers/adminController');
const importBlockRegex = /const \{([\s\S]*?)\} = require\('\.\.\/controllers\/adminController'\);/;
const importMatch = importBlockRegex.exec(routesContent);

if (!importMatch) {
    console.error("Could not find import block in adminRoutes.js");
    process.exit(1);
}

const importsList = importMatch[1]
    .split(',')
    .map(i => i.trim())
    .filter(i => i.length > 0 && !i.startsWith('//'));

console.log(`Found ${importsList.length} imports in adminRoutes.js`);

// 3. Compare
const missingExports = importsList.filter(imp => !exportsList.includes(imp));

if (missingExports.length > 0) {
    console.error("❌ CRITICAL: The following imports are MISSING in adminController.js exports:");
    missingExports.forEach(m => console.error(`   - ${m}`));
    console.log("This will cause the server to crash on startup.");
} else {
    console.log("✅ All imports in adminRoutes.js match an export in adminController.js");
}
