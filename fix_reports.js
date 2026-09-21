const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'mobile', 'src', 'screens', 'reports', 'PerformanceReportsScreen.jsx');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the index of the second "import React from 'react';"
  const splitIndex = content.indexOf("import React from 'react';", 10); // skip the first one if any
  
  if (splitIndex !== -1) {
    // The valid original code is from splitIndex onwards
    let originalCode = content.substring(splitIndex).trim();
    
    // Apply the header fixes directly to the original code
    // 1. Remove manual Menu and Back Arrow buttons
    originalCode = originalCode.replace(/<TouchableOpacity[^>]*onPress=\{[^}]*navigation\.(?:openDrawer|goBack)\(\)[^}]*\}[^>]*>\s*<(?:Menu|ArrowLeft)[^>]*\/>\s*<\/TouchableOpacity>/g, '');
    
    // 2. Remove redundant headerTitle / pageTitle rendering near the top
    originalCode = originalCode.replace(/<View>\s*<Text style=\{styles\.(?:headerTitle|pageTitle)\}>[^<]+<\/Text>\s*<Text style=\{styles\.(?:headerSubtitle|pageSubtitle)\}>[^<]+<\/Text>\s*<\/View>/g, '');
    
    // 3. Strip massive paddingTop
    originalCode = originalCode.replace(/((?:pageH|h)eader:\s*\{[^}]*?)paddingTop:\s*\d+,?\s*([^}]*\})/g, '$1$2');

    fs.writeFileSync(filePath, originalCode, 'utf8');
    console.log('Successfully fixed PerformanceReportsScreen.jsx');
  } else {
    console.log('No duplication found.');
  }
}
