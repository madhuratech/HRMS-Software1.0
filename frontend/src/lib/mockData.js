

export const CURRENT_USER = {
  id: 'u1',
  name: 'Alex Johnson',
  role: 'SUPER_ADMIN', // Default role for demo
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
};

export const MOCK_EMPLOYEES = [
{
  id: 'e1',
  name: 'Sarah Wilson',
  role: 'BRANCH_MANAGER',
  branch: 'Downtown',
  status: 'Active',
  joinDate: '2023-01-15',
  attendance: 96,
  salesTarget: 500000,
  salesAchieved: 450000,
  onboardingStatus: 'COMPLETED',
  offboardingStatus: 'NONE'
},
{
  id: 'e2',
  name: 'Mike Chen',
  role: 'SALES_MANAGER',
  branch: 'Westside',
  status: 'Active',
  joinDate: '2023-03-10',
  attendance: 92,
  salesTarget: 300000,
  salesAchieved: 320000,
  onboardingStatus: 'COMPLETED',
  offboardingStatus: 'NONE'
},
{
  id: 'e3',
  name: 'Jessica Davis',
  role: 'SERVICE_STAFF',
  branch: 'Downtown',
  status: 'On Leave',
  joinDate: '2022-11-05',
  attendance: 85,
  onboardingStatus: 'VERIFICATION_PENDING',
  offboardingStatus: 'NONE'
},
{
  id: 'e4',
  name: 'David Kim',
  role: 'SERVICE_STAFF',
  branch: 'North Hills',
  status: 'Active',
  joinDate: '2024-02-01',
  attendance: 98,
  onboardingStatus: 'DOCUMENT_SUBMISSION',
  offboardingStatus: 'NONE'
}];


export const MOCK_SALES = [
{ id: 's1', date: '2023-10-01', model: 'Sport Bike X1', amount: 150000, executiveId: 'e2', status: 'completed' },
{ id: 's2', date: '2023-10-02', model: 'Cruiser 500', amount: 220000, executiveId: 'e2', status: 'completed' },
{ id: 's3', date: '2023-10-03', model: 'Scooter Z', amount: 85000, executiveId: 'e2', status: 'pending' },
{ id: 's4', date: '2023-10-05', model: 'Sport Bike X1', amount: 150000, executiveId: 'e2', status: 'completed' }];


export const MOCK_ENQUIRIES = [
{
  id: 'l1',
  customerName: 'Alice Johnson',
  phone: '+1 (555) 101-2020',
  modelInterest: 'Cruiser 500',
  status: 'NEW',
  lastContact: '2023-10-20',
  nextFollowUp: '2023-10-22',
  remarks: [{ date: '2023-10-20', text: 'Walk-in enquiry. Interested in red color.' }],
  assignedTo: 'e2'
},
{
  id: 'l2',
  customerName: 'Mark Smith',
  phone: '+1 (555) 303-4040',
  modelInterest: 'Scooter Z',
  status: 'TEST_DRIVE',
  lastContact: '2023-10-18',
  nextFollowUp: '2023-10-25',
  remarks: [
  { date: '2023-10-15', text: 'Called for details.' },
  { date: '2023-10-18', text: 'Test drive completed. Liked the handling.' }],

  assignedTo: 'e2'
},
{
  id: 'l3',
  customerName: 'David Lee',
  phone: '+1 (555) 505-6060',
  modelInterest: 'Sport Bike X1',
  status: 'QUOTATION',
  lastContact: '2023-10-21',
  nextFollowUp: '2023-10-24',
  remarks: [
  { date: '2023-10-21', text: 'Sent price breakdown via WhatsApp.' }],

  assignedTo: 'e2'
}];


export const MOCK_TASKS = [
{ id: 't1', customerName: 'John Doe', vehicleModel: 'Cruiser 500', issue: 'Oil Leak', status: 'IN_PROGRESS', assignedTo: 'e3', date: '2023-10-10' },
{ id: 't2', customerName: 'Jane Smith', vehicleModel: 'Scooter Z', issue: 'Brake Check', status: 'COMPLETED', assignedTo: 'e4', date: '2023-10-11' },
{ id: 't3', customerName: 'Bob Brown', vehicleModel: 'Sport Bike X1', issue: 'General Service', status: 'PENDING', assignedTo: 'e3', date: '2023-10-12' }];