const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            if (f.endsWith('.js')) {
                callback(path.join(dir, f));
            }
        }
    });
}

const rootDir = __dirname;
const errors = [];

walkDir(rootDir, (filePath) => {
    if (filePath.includes('node_modules')) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const requireRegex = /require\(['"](\.[^'"]+)['"]\)/g;
    let match;

    while ((match = requireRegex.exec(content)) !== null) {
        const importPath = match[1];
        const dir = path.dirname(filePath);

        let resolvedPath;
        try {
            // resolve relative path
            resolvedPath = path.resolve(dir, importPath);

            // Checks
            let finalPath = resolvedPath;
            if (fs.existsSync(resolvedPath + '.js')) finalPath = resolvedPath + '.js';
            else if (fs.existsSync(resolvedPath)) {
                if (fs.statSync(resolvedPath).isDirectory()) {
                    if (fs.existsSync(path.join(resolvedPath, 'index.js'))) finalPath = path.join(resolvedPath, 'index.js');
                }
            } else {
                // Try json
                if (fs.existsSync(resolvedPath + '.json')) finalPath = resolvedPath + '.json';
            }

            if (fs.existsSync(finalPath)) {
                // Check casing
                const actualFilename = path.basename(finalPath);
                const requestedFilename = path.basename(finalPath.toLowerCase() === resolvedPath.toLowerCase() + '.js' ? resolvedPath + '.js' : (fs.statSync(finalPath).isDirectory() ? 'index.js' : resolvedPath));

                // We need to read the directory to get the REAL casing from disk
                const parentDir = path.dirname(finalPath);
                const filesInParent = fs.readdirSync(parentDir);

                const exactMatch = filesInParent.find(f => f === path.basename(finalPath));

                if (!exactMatch) {
                    // This implies case mismatch or it wasn't found in list but exists (should not happen)
                    const caseInsensitiveMatch = filesInParent.find(f => f.toLowerCase() === path.basename(finalPath).toLowerCase());
                    if (caseInsensitiveMatch && caseInsensitiveMatch !== path.basename(finalPath)) {
                        errors.push(`Case Mismatch in ${path.basename(filePath)}: imports '${importPath}' but disk has '${caseInsensitiveMatch}'`);
                    }
                }

                // Also check the import string itself against the match
                // If import is '../models/user', resolved is 'User.js'. 
                // We want to ensure 'user' matches 'User' (ignoring ext)

                const importName = path.basename(importPath);
                const diskNameNoExt = exactMatch ? exactMatch.replace(/\.[^/.]+$/, "") : "";

                if (exactMatch && importName.toLowerCase() === diskNameNoExt.toLowerCase() && importName !== diskNameNoExt) {
                    errors.push(`Case Mismatch in ${path.basename(filePath)}: imports '${importName}' but disk has '${exactMatch}'`);
                }

            } else {
                // Ignore if it's a node module or alias we missed, but we filtered only relative imports starting with .
                // errors.push(`Missing File in ${path.basename(filePath)}: '${importPath}'`);
            }
        } catch (err) {
            // ignore
        }
    }
});

if (errors.length > 0) {
    console.error("❌ Case Sensitivity Errors Found:");
    errors.forEach(e => console.error(e));
    process.exit(1);
} else {
    console.log("✅ No casing issues found.");
    process.exit(0);
}
