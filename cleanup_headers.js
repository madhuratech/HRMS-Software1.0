const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'mobile', 'src', 'screens');

function removeBlock(content, startStr, endStr) {
    let result = content;
    let startIndex = result.indexOf(startStr);
    while (startIndex !== -1) {
        // Find matching end tag
        let i = startIndex;
        let openTags = 0;
        let foundEnd = false;
        
        // This is a naive regex-based removal for specific known blocks
        // For <LinearGradient ... style={styles.pageHeader}> ... </LinearGradient>
        if (startStr.includes('LinearGradient')) {
            const endGradient = '</LinearGradient>';
            const endIndex = result.indexOf(endGradient, startIndex);
            if (endIndex !== -1) {
                result = result.substring(0, startIndex) + result.substring(endIndex + endGradient.length);
            } else {
                break;
            }
        } else if (startStr.includes('headerContainer')) {
            // For <View style={styles.headerContainer}> ... </View>
            // We need to count matching <View> and </View> tags
            let count = 0;
            let p = startIndex;
            while (p < result.length) {
                if (result.startsWith('<View', p)) {
                    // Make sure it's not self closing
                    const closeBracket = result.indexOf('>', p);
                    if (result[closeBracket - 1] !== '/') {
                        count++;
                    }
                    p += 5;
                } else if (result.startsWith('</View>', p)) {
                    count--;
                    if (count === 0) {
                        result = result.substring(0, startIndex) + result.substring(p + 7);
                        break;
                    }
                    p += 7;
                } else {
                    p++;
                }
            }
        } else {
           break;
        }
        
        startIndex = result.indexOf(startStr);
    }
    return result;
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Remove <LinearGradient colors={['#FFF', '#F8FAFC']} style={styles.pageHeader}> ... </LinearGradient>
            // Match any LinearGradient that has style={styles.pageHeader}
            const pageHeaderRegex = /<LinearGradient[^>]*style=\{styles\.pageHeader\}[^>]*>[\s\S]*?<\/LinearGradient>/g;
            content = content.replace(pageHeaderRegex, '');

            // Remove <View style={styles.headerContainer}> ... </View>
            // A bit trickier with regex because of nested Views, but let's try our manual parser
            content = removeBlock(content, '<View style={styles.headerContainer}>', '</View>');
            
            // Clean up empty lines
            content = content.replace(/\n\s*\n/g, '\n\n');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Cleaned up ${file}`);
            }
        }
    }
}

processDirectory(screensDir);
console.log('Cleanup complete.');
