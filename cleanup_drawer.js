const fs = require('fs');
const path = require('path');

const drawerNavigatorPath = path.join(__dirname, 'mobile', 'src', 'navigation', 'DrawerNavigator.jsx');

let content = fs.readFileSync(drawerNavigatorPath, 'utf8');

// Remove options={{ headerShown: false }} globally
content = content.replace(/options=\{\{\s*headerShown:\s*false\s*\}\}/g, '');

fs.writeFileSync(drawerNavigatorPath, content);
console.log('Cleaned up DrawerNavigator.jsx');
