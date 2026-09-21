const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.json') && !filePath.endsWith('.jsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<<<<<<< HEAD')) return;
    
    console.log(`Fixing ${filePath}`);
    
    const lines = content.split('\n');
    const newLines = [];
    let inHead = false;
    let inOther = false;
    
    for (let line of lines) {
        if (line.startsWith('<<<<<<< HEAD')) {
            inHead = true;
            continue;
        }
        if (line.startsWith('=======')) {
            inHead = false;
            inOther = true;
            continue;
        }
        if (line.startsWith('>>>>>>> origin/main') || line.startsWith('>>>>>>>')) {
            inOther = false;
            continue;
        }
        
        if (!inOther) {
            newLines.push(line);
        }
    }
    
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        if (file === 'node_modules' || file === '.git') continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

traverseDir(__dirname);
console.log('Done resolving all conflicts by taking HEAD!');
