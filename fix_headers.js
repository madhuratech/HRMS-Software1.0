const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'mobile', 'src', 'screens');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(screensDir, (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Remove manual Menu and Back Arrow buttons
    content = content.replace(/<TouchableOpacity[^>]*onPress=\{[^}]*navigation\.(?:openDrawer|goBack)\(\)[^}]*\}[^>]*>\s*<(?:Menu|ArrowLeft)[^>]*\/>\s*<\/TouchableOpacity>/g, '');
    
    // 2. Remove redundant headerTitle / pageTitle rendering near the top
    content = content.replace(/<View>\s*<Text style=\{styles\.(?:headerTitle|pageTitle)\}>[^<]+<\/Text>\s*<Text style=\{styles\.(?:headerSubtitle|pageSubtitle)\}>[^<]+<\/Text>\s*<\/View>/g, '');
    
    // 3. Strip massive paddingTop
    content = content.replace(/((?:pageH|h)eader:\s*\{[^}]*?)paddingTop:\s*\d+,?\s*([^}]*\})/g, '$1$2');

    // 4. Update Dashboard cards border radius to 16
    if (filePath.includes('DashboardMain.jsx') || filePath.includes('EmployeeDashboardScreen.jsx') || filePath.includes('SuperAdminDashboardScreen.jsx')) {
      content = content.replace(/borderRadius:\s*\d+/g, 'borderRadius: 16');
      
      // Ensure "View All" on Performance goes to correct screen
      content = content.replace(/<TouchableOpacity style=\{styles\.viewAllButton\}>\s*<Text/g, `<TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('KPI')}>\n            <Text`);
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
