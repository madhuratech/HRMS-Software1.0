const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'mobile', 'src', 'screens', 'reports');

if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
}

const templates = [
    { name: 'EmployeeReportsScreen.jsx', title: 'Employee Reports' },
    { name: 'AttendanceReportsModuleScreen.jsx', title: 'Attendance Reports Module' },
    { name: 'LeaveReportsScreen.jsx', title: 'Leave Reports' },
    { name: 'PayrollReportsModuleScreen.jsx', title: 'Payroll Reports Module' },
    { name: 'RecruitmentReportsScreen.jsx', title: 'Recruitment Reports' },
    { name: 'ProjectReportsScreen.jsx', title: 'Project Reports' },
    { name: 'ExpenseReportsScreen.jsx', title: 'Expense Reports' },
    { name: 'HelpDeskReportsScreen.jsx', title: 'Help Desk Reports' }
];

const screenTemplate = (title) => `import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Menu } from 'lucide-react-native';

const ${title.replace(/\s+/g, '')}Screen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
            <Menu size={24} color="#1f2937" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>${title}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <Text style={styles.cardText}>Basic reporting metrics for ${title} will be displayed here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default ${title.replace(/\s+/g, '')}Screen;
`;

templates.forEach(({ name, title }) => {
    const filePath = path.join(screensDir, name);
    fs.writeFileSync(filePath, screenTemplate(title));
    console.log("Created " + name);
});
