import {
  Organization,
  Branch,
  Shift,
  Seat,
  MembershipPlan,
  Member,
  Membership,
  SeatAssignment,
  Payment,
  AttendanceRecord,
  AccessLog,
  Expense,
  WaitlistEntry,
  NotificationLog,
} from '../types';
import { addDays, getTodayString } from '../utils/dateMath';
import { generateMemberQRToken } from '../utils/qrGenerator';

const today = getTodayString();

export const INITIAL_ORG: Organization = {
  id: 'org_1',
  name: '24Library Study Spaces & Co-Learning Hub',
  tagline: 'India\'s Premier Shift-Aware Reading Room Network',
  subscriptionPlan: 'PREMIUM',
  contactEmail: 'desk@24library.in',
  supportPhone: '+91 98200 24240',
  createdAt: '2025-01-01',
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br_1',
    orgId: 'org_1',
    name: 'Apex Central Reading Hub - Dadar',
    code: 'MUM-01',
    address: '4th Floor, Knowledge Tower, Near Station, Dadar West, Mumbai',
    phone: '+91 98201 11222',
    contactPerson: 'Karan Mehra (Manager)',
    capacity: 36,
    active: true,
  },
  {
    id: 'br_2',
    orgId: 'org_1',
    name: 'Apex West End Scholar Lounge - Andheri',
    code: 'MUM-02',
    address: '2nd Floor, Scholar Plaza, SV Road, Andheri West, Mumbai',
    phone: '+91 98202 33444',
    contactPerson: 'Snehal Deshmukh (Admin)',
    capacity: 24,
    active: true,
  },
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'sh_1',
    branchId: 'br_1',
    name: 'Morning Shift (06:00 AM - 12:00 PM)',
    startTime: '06:00',
    endTime: '12:00',
    defaultPrice: 1500,
    color: '#0284c7', // Sky blue
    active: true,
    order: 1,
  },
  {
    id: 'sh_2',
    branchId: 'br_1',
    name: 'Afternoon Shift (12:00 PM - 05:00 PM)',
    startTime: '12:00',
    endTime: '17:00',
    defaultPrice: 1400,
    color: '#ea580c', // Orange
    active: true,
    order: 2,
  },
  {
    id: 'sh_3',
    branchId: 'br_1',
    name: 'Evening Shift (05:00 PM - 10:00 PM)',
    startTime: '17:00',
    endTime: '22:00',
    defaultPrice: 1600,
    color: '#7c3aed', // Purple
    active: true,
    order: 3,
  },
  {
    id: 'sh_4',
    branchId: 'br_1',
    name: 'Night Owl Shift (10:00 PM - 06:00 AM)',
    startTime: '22:00',
    endTime: '06:00',
    defaultPrice: 1800,
    color: '#0f766e', // Teal
    active: true,
    order: 4,
  },
  {
    id: 'sh_5',
    branchId: 'br_1',
    name: 'Full Day 24h All-Access Pass',
    startTime: '00:00',
    endTime: '23:59',
    defaultPrice: 2800,
    color: '#b91c1c', // Ruby
    active: true,
    order: 5,
  },
];

export const INITIAL_PLANS: MembershipPlan[] = [
  {
    id: 'plan_1m',
    name: 'Monthly Standard Pass',
    durationDays: 30,
    basePrice: 1600,
    description: '30 Days Dedicated Shift Seat with Wi-Fi & AC access.',
    features: ['High-speed 300 Mbps Wi-Fi', 'Individual Power Socket', 'Daily Sanitized Desk', 'Filtered RO Water'],
  },
  {
    id: 'plan_3m',
    name: 'Quarterly Scholar Pro (10% Off)',
    durationDays: 90,
    basePrice: 4320,
    description: '90 Days Reserved Study Slot + Free Locker Allowance.',
    features: ['Free Personal Locker', 'Zero Cancellation Charge', 'High-speed Wi-Fi', 'Discussion Room Credits'],
  },
  {
    id: 'plan_6m',
    name: 'Half-Yearly Ranker Pass (15% Off)',
    durationDays: 180,
    basePrice: 8160,
    description: '180 Days Intensive Exam Prep with guaranteed seat lock.',
    features: ['Priority Seat Retention', 'Dedicated Deluxe Locker', '24/7 Gate Access Privilege', 'Guest Day Passes (2)'],
  },
  {
    id: 'plan_12m',
    name: 'Annual Aspirant Gold (25% Off)',
    durationDays: 365,
    basePrice: 14400,
    description: '365 Days Uninterrupted All-Year Scholar Membership.',
    features: ['Permanent Nameplate on Desk', 'Unlimited Lockers', 'Free Branch Switch Option', 'VIP Lounge Access'],
  },
];

// Generate 36 seats for Branch 1
export function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];
  
  // Row A: AC Quiet Zone (8 seats)
  for (let i = 1; i <= 8; i++) {
    const label = `A-${String(i).padStart(2, '0')}`;
    seats.push({
      id: `seat_a_${i}`,
      branchId: 'br_1',
      label,
      row: 1,
      col: i,
      zone: 'AC Quiet',
      type: 'FIXED',
      status: i === 7 ? 'BLOCKED' : 'ACTIVE',
      isBlocked: i === 7,
      blockReason: i === 7 ? 'AC Duct Maintenance & Lighting upgrade' : undefined,
      powerSocket: true,
      hasLocker: false,
    });
  }

  // Row B: Deluxe Cubicles with lockers (10 seats)
  for (let i = 1; i <= 10; i++) {
    const label = `B-${String(i).padStart(2, '0')}`;
    seats.push({
      id: `seat_b_${i}`,
      branchId: 'br_1',
      label,
      row: 2,
      col: i,
      zone: 'Deluxe Cubicle',
      type: 'FIXED',
      status: 'ACTIVE',
      powerSocket: true,
      hasLocker: true,
    });
  }

  // Row C: Standard Reading Hall (12 seats)
  for (let i = 1; i <= 12; i++) {
    const label = `C-${String(i).padStart(2, '0')}`;
    seats.push({
      id: `seat_c_${i}`,
      branchId: 'br_1',
      label,
      row: 3,
      col: i,
      zone: 'Standard',
      type: 'FIXED',
      status: 'ACTIVE',
      powerSocket: true,
      hasLocker: false,
    });
  }

  // Row D: Discussion & Floating Zone (6 seats)
  for (let i = 1; i <= 6; i++) {
    const label = `D-${String(i).padStart(2, '0')}`;
    seats.push({
      id: `seat_d_${i}`,
      branchId: 'br_1',
      label,
      row: 4,
      col: i,
      zone: 'Discussion',
      type: 'FLOATING',
      status: 'ACTIVE',
      powerSocket: true,
      hasLocker: false,
    });
  }

  return seats;
}

export const INITIAL_SEATS = generateInitialSeats();

// Pre-seeded Members with diverse lifecycle states
export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem_1',
    memberCode: '24L-MUM-1001',
    branchId: 'br_1',
    fullName: 'Rahul Sharma',
    phone: '+91 98201 11001',
    email: 'rahul.sharma@example.com',
    emergencyContact: '+91 98201 99001 (Father)',
    idProofNumber: 'XXXX-XXXX-4812',
    targetExam: 'UPSC Civil Services 2027',
    joinedDate: addDays(today, -60),
    status: 'ACTIVE',
    qrToken: generateMemberQRToken('24L-MUM-1001', 'mem_1', 'br_1'),
    notes: 'Serious UPSC aspirant. Prefers AC quiet zone.',
  },
  {
    id: 'mem_2',
    memberCode: '24L-MUM-1002',
    branchId: 'br_1',
    fullName: 'Priya Nair',
    phone: '+91 98201 11002',
    email: 'priya.nair@example.com',
    emergencyContact: '+91 98201 99002 (Mother)',
    idProofNumber: 'XXXX-XXXX-8921',
    targetExam: 'CA Final Nov 2026',
    joinedDate: addDays(today, -28),
    status: 'EXPIRING',
    qrToken: generateMemberQRToken('24L-MUM-1002', 'mem_2', 'br_1'),
    notes: 'Expires in 2 days! Needs renewal nudge.',
  },
  {
    id: 'mem_3',
    memberCode: '24L-MUM-1003',
    branchId: 'br_1',
    fullName: 'Amit Verma',
    phone: '+91 98201 11003',
    email: 'amit.verma@example.com',
    emergencyContact: '+91 98201 99003',
    idProofNumber: 'XXXX-XXXX-3341',
    targetExam: 'NEET PG 2027',
    joinedDate: addDays(today, -45),
    status: 'ACTIVE',
    qrToken: generateMemberQRToken('24L-MUM-1003', 'mem_3', 'br_1'),
    notes: 'Night owl shift subscriber.',
  },
  {
    id: 'mem_4',
    memberCode: '24L-MUM-1004',
    branchId: 'br_1',
    fullName: 'Sneha Kulkarni',
    phone: '+91 98201 11004',
    email: 'sneha.k@example.com',
    emergencyContact: '+91 98201 99004',
    idProofNumber: 'XXXX-XXXX-7729',
    targetExam: 'GATE Computer Science',
    joinedDate: addDays(today, -80),
    status: 'ACTIVE',
    qrToken: generateMemberQRToken('24L-MUM-1004', 'mem_4', 'br_1'),
    notes: 'Quarterly subscriber, highly regular attendance.',
  },
  {
    id: 'mem_5',
    memberCode: '24L-MUM-1005',
    branchId: 'br_1',
    fullName: 'Vikram Malhotra',
    phone: '+91 98201 11005',
    email: 'vikram.m@example.com',
    emergencyContact: '+91 98201 99005',
    idProofNumber: 'XXXX-XXXX-1044',
    targetExam: 'State PSC Exam',
    joinedDate: addDays(today, -24),
    status: 'EXPIRING',
    qrToken: generateMemberQRToken('24L-MUM-1005', 'mem_5', 'br_1'),
    notes: 'Expires in 6 days (7-day reminder bucket).',
  },
  {
    id: 'mem_6',
    memberCode: '24L-MUM-1006',
    branchId: 'br_1',
    fullName: 'Ananya Sen',
    phone: '+91 98201 11006',
    email: 'ananya.sen@example.com',
    emergencyContact: '+91 98201 99006',
    idProofNumber: 'XXXX-XXXX-5521',
    targetExam: 'Judiciary / Law Prep',
    joinedDate: addDays(today, -15),
    status: 'ACTIVE',
    qrToken: generateMemberQRToken('24L-MUM-1006', 'mem_6', 'br_1'),
    notes: 'Partial payment made, ₹1,200 overdue.',
  },
  {
    id: 'mem_7',
    memberCode: '24L-MUM-1007',
    branchId: 'br_1',
    fullName: 'Saurabh Patil',
    phone: '+91 98201 11007',
    email: 'saurabh.patil@example.com',
    emergencyContact: '+91 98201 99007',
    idProofNumber: 'XXXX-XXXX-9981',
    targetExam: 'Bank PO / SBI Clerk',
    joinedDate: addDays(today, -34),
    status: 'EXPIRED',
    qrToken: generateMemberQRToken('24L-MUM-1007', 'mem_7', 'br_1'),
    notes: 'Expired 4 days ago. QR gate access blocked.',
  },
  {
    id: 'mem_8',
    memberCode: '24L-MUM-1008',
    branchId: 'br_1',
    fullName: 'Rohan Joshi',
    phone: '+91 98201 11008',
    email: 'rohan.joshi@example.com',
    emergencyContact: '+91 98201 99008',
    idProofNumber: 'XXXX-XXXX-6119',
    targetExam: 'IIT JEE Advance Repeater',
    joinedDate: addDays(today, -18),
    status: 'EXPIRING',
    qrToken: generateMemberQRToken('24L-MUM-1008', 'mem_8', 'br_1'),
    notes: 'Expires in 12 days (8-15 day reminder bucket).',
  },
];

export const INITIAL_MEMBERSHIPS: Membership[] = [
  {
    id: 'msh_1',
    memberId: 'mem_1',
    planId: 'plan_3m',
    branchId: 'br_1',
    shiftId: 'sh_1', // Morning
    startDate: addDays(today, -60),
    endDate: addDays(today, 30),
    status: 'ACTIVE',
    totalFee: 4320,
    paidAmount: 4320,
    dueAmount: 0,
    paymentStatus: 'PAID',
    autoRenew: true,
  },
  {
    id: 'msh_2',
    memberId: 'mem_2',
    planId: 'plan_1m',
    branchId: 'br_1',
    shiftId: 'sh_1', // Morning
    startDate: addDays(today, -28),
    endDate: addDays(today, 2), // Expiring in 2 days!
    status: 'EXPIRING',
    totalFee: 1600,
    paidAmount: 1600,
    dueAmount: 0,
    paymentStatus: 'PAID',
    autoRenew: false,
  },
  {
    id: 'msh_3',
    memberId: 'mem_3',
    planId: 'plan_1m',
    branchId: 'br_1',
    shiftId: 'sh_4', // Night owl
    startDate: addDays(today, -15),
    endDate: addDays(today, 15),
    status: 'ACTIVE',
    totalFee: 1800,
    paidAmount: 1800,
    dueAmount: 0,
    paymentStatus: 'PAID',
    autoRenew: true,
  },
  {
    id: 'msh_4',
    memberId: 'mem_4',
    planId: 'plan_3m',
    branchId: 'br_1',
    shiftId: 'sh_2', // Afternoon
    startDate: addDays(today, -80),
    endDate: addDays(today, 10),
    status: 'ACTIVE',
    totalFee: 4320,
    paidAmount: 4320,
    dueAmount: 0,
    paymentStatus: 'PAID',
    autoRenew: true,
  },
  {
    id: 'msh_5',
    memberId: 'mem_5',
    planId: 'plan_1m',
    branchId: 'br_1',
    shiftId: 'sh_3', // Evening
    startDate: addDays(today, -24),
    endDate: addDays(today, 6), // Expiring in 6 days!
    status: 'EXPIRING',
    totalFee: 1600,
    paidAmount: 1600,
    dueAmount: 0,
    paymentStatus: 'PAID',
    autoRenew: false,
  },
  {
    id: 'msh_6',
    memberId: 'mem_6',
    planId: 'plan_1m',
    branchId: 'br_1',
    shiftId: 'sh_1', // Morning
    startDate: addDays(today, -15),
    endDate: addDays(today, 15),
    status: 'ACTIVE',
    totalFee: 1600,
    paidAmount: 400,
    dueAmount: 1200,
    paymentStatus: 'OVERDUE',
    autoRenew: false,
  },
  {
    id: 'msh_7',
    memberId: 'mem_7',
    planId: 'plan_1m',
    branchId: 'br_1',
    shiftId: 'sh_2', // Afternoon
    startDate: addDays(today, -34),
    endDate: addDays(today, -4), // Expired 4 days ago!
    status: 'EXPIRED',
    totalFee: 1600,
    paidAmount: 1600,
    dueAmount: 0,
    paymentStatus: 'PAID',
    autoRenew: false,
  },
  {
    id: 'msh_8',
    memberId: 'mem_8',
    planId: 'plan_1m',
    branchId: 'br_1',
    shiftId: 'sh_3', // Evening
    startDate: addDays(today, -18),
    endDate: addDays(today, 12), // Expiring in 12 days!
    status: 'EXPIRING',
    totalFee: 1600,
    paidAmount: 1600,
    dueAmount: 0,
    paymentStatus: 'PAID',
    autoRenew: false,
  },
];

// Active Seat Assignments demonstrating shift awareness
export const INITIAL_ASSIGNMENTS: SeatAssignment[] = [
  // Seat A-01: Morning = Rahul Sharma (mem_1)
  {
    id: 'asgn_1',
    memberId: 'mem_1',
    seatId: 'seat_a_1',
    shiftId: 'sh_1', // Morning
    branchId: 'br_1',
    membershipId: 'msh_1',
    startDate: addDays(today, -60),
    endDate: addDays(today, 30),
    status: 'ACTIVE',
    assignedAt: addDays(today, -60),
  },
  // Seat A-02: Morning = Priya Nair (mem_2)
  {
    id: 'asgn_2',
    memberId: 'mem_2',
    seatId: 'seat_a_2',
    shiftId: 'sh_1', // Morning
    branchId: 'br_1',
    membershipId: 'msh_2',
    startDate: addDays(today, -28),
    endDate: addDays(today, 2),
    status: 'ACTIVE',
    assignedAt: addDays(today, -28),
  },
  // Seat A-01: Night Owl = Amit Verma (mem_3) -> PROOF: Same seat A-01 shared with different shift!
  {
    id: 'asgn_3',
    memberId: 'mem_3',
    seatId: 'seat_a_1',
    shiftId: 'sh_4', // Night owl
    branchId: 'br_1',
    membershipId: 'msh_3',
    startDate: addDays(today, -15),
    endDate: addDays(today, 15),
    status: 'ACTIVE',
    assignedAt: addDays(today, -15),
  },
  // Seat B-01: Afternoon = Sneha Kulkarni (mem_4)
  {
    id: 'asgn_4',
    memberId: 'mem_4',
    seatId: 'seat_b_1',
    shiftId: 'sh_2', // Afternoon
    branchId: 'br_1',
    membershipId: 'msh_4',
    startDate: addDays(today, -80),
    endDate: addDays(today, 10),
    status: 'ACTIVE',
    assignedAt: addDays(today, -80),
  },
  // Seat B-02: Evening = Vikram Malhotra (mem_5)
  {
    id: 'asgn_5',
    memberId: 'mem_5',
    seatId: 'seat_b_2',
    shiftId: 'sh_3', // Evening
    branchId: 'br_1',
    membershipId: 'msh_5',
    startDate: addDays(today, -24),
    endDate: addDays(today, 6),
    status: 'ACTIVE',
    assignedAt: addDays(today, -24),
  },
  // Seat C-01: Morning = Ananya Sen (mem_6)
  {
    id: 'asgn_6',
    memberId: 'mem_6',
    seatId: 'seat_c_1',
    shiftId: 'sh_1', // Morning
    branchId: 'br_1',
    membershipId: 'msh_6',
    startDate: addDays(today, -15),
    endDate: addDays(today, 15),
    status: 'ACTIVE',
    assignedAt: addDays(today, -15),
  },
  // Seat C-02: Evening = Rohan Joshi (mem_8)
  {
    id: 'asgn_7',
    memberId: 'mem_8',
    seatId: 'seat_c_2',
    shiftId: 'sh_3', // Evening
    branchId: 'br_1',
    membershipId: 'msh_8',
    startDate: addDays(today, -18),
    endDate: addDays(today, 12),
    status: 'ACTIVE',
    assignedAt: addDays(today, -18),
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_1',
    receiptNo: 'RCP-2026-0101',
    memberId: 'mem_1',
    membershipId: 'msh_1',
    amount: 4320,
    paymentDate: `${addDays(today, -60)} 10:15`,
    method: 'UPI_GPAY',
    referenceTxnId: 'UPI-AXIS-99201948',
    notes: 'Quarterly admission fee full clearance.',
  },
  {
    id: 'pay_2',
    receiptNo: 'RCP-2026-0102',
    memberId: 'mem_2',
    membershipId: 'msh_2',
    amount: 1600,
    paymentDate: `${addDays(today, -28)} 09:30`,
    method: 'UPI_PHONEPE',
    referenceTxnId: 'TXN-PHPE-8827192',
    notes: 'Monthly pass fee received.',
  },
  {
    id: 'pay_3',
    receiptNo: 'RCP-2026-0103',
    memberId: 'mem_3',
    membershipId: 'msh_3',
    amount: 1800,
    paymentDate: `${addDays(today, -15)} 21:40`,
    method: 'CASH',
    notes: 'Cash collected by desk operator.',
  },
  {
    id: 'pay_4',
    receiptNo: 'RCP-2026-0104',
    memberId: 'mem_4',
    membershipId: 'msh_4',
    amount: 4320,
    paymentDate: `${addDays(today, -80)} 14:10`,
    method: 'CARD',
    referenceTxnId: 'POS-HDFC-991823',
    notes: 'Debit card swipe.',
  },
  {
    id: 'pay_5',
    receiptNo: 'RCP-2026-0105',
    memberId: 'mem_6',
    membershipId: 'msh_6',
    amount: 400,
    paymentDate: `${addDays(today, -15)} 11:00`,
    method: 'UPI_PAYTM',
    referenceTxnId: 'PAYTM-882711',
    notes: 'Partial advance token; ₹1,200 balance promised.',
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // Rahul Sharma is currently INSIDE the library (checked in 2 hours ago)
  {
    id: 'att_1',
    memberId: 'mem_1',
    branchId: 'br_1',
    shiftId: 'sh_1',
    date: today,
    checkInTime: '06:15:20',
    status: 'INSIDE',
    method: 'QR_SCAN',
  },
  // Sneha Kulkarni checked in yesterday and completed a 5h 15m session
  {
    id: 'att_2',
    memberId: 'mem_4',
    branchId: 'br_1',
    shiftId: 'sh_2',
    date: addDays(today, -1),
    checkInTime: '12:05:10',
    checkOutTime: '17:20:45',
    durationMinutes: 315,
    status: 'COMPLETED',
    method: 'QR_SCAN',
  },
  // Priya Nair completed morning study yesterday
  {
    id: 'att_3',
    memberId: 'mem_2',
    branchId: 'br_1',
    shiftId: 'sh_1',
    date: addDays(today, -1),
    checkInTime: '06:30:00',
    checkOutTime: '11:45:00',
    durationMinutes: 315,
    status: 'COMPLETED',
    method: 'QR_SCAN',
  },
];

export const INITIAL_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'log_1',
    memberId: 'mem_1',
    memberCode: '24L-MUM-1001',
    memberName: 'Rahul Sharma',
    branchId: 'br_1',
    timestamp: `${today} 06:15:20`,
    result: 'ALLOWED',
    reason: 'Active Membership & Shift Matched (Morning)',
    gateId: 'GATE-01 (Turnstile Left)',
    shiftId: 'sh_1',
  },
  {
    id: 'log_2',
    memberId: 'mem_7',
    memberCode: '24L-MUM-1007',
    memberName: 'Saurabh Patil',
    branchId: 'br_1',
    timestamp: `${today} 08:30:11`,
    result: 'DENIED',
    reason: 'Membership EXPIRED on ' + addDays(today, -4),
    gateId: 'GATE-01 (Turnstile Left)',
    shiftId: 'sh_2',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    branchId: 'br_1',
    category: 'RENT',
    title: 'Monthly Commercial Space Lease (Dadar)',
    amount: 45000,
    date: addDays(today, -10),
    paymentMethod: 'NETBANKING',
    recordedBy: 'Karan Mehra',
    receiptRef: 'LEASE-DDR-2026/08',
  },
  {
    id: 'exp_2',
    branchId: 'br_1',
    category: 'ELECTRICITY',
    title: 'Commercial Power & Multi-Split AC Bill (Adani)',
    amount: 18500,
    date: addDays(today, -5),
    paymentMethod: 'UPI_GPAY',
    recordedBy: 'Karan Mehra',
    receiptRef: 'ADANI-PWR-8821',
  },
  {
    id: 'exp_3',
    branchId: 'br_1',
    category: 'WIFI_INTERNET',
    title: 'Dual 500 Mbps Dedicated Fiber Leased Line (Airtel)',
    amount: 3500,
    date: addDays(today, -7),
    paymentMethod: 'UPI_PHONEPE',
    recordedBy: 'Snehal Deshmukh',
    receiptRef: 'AIRTEL-FIBER-092',
  },
  {
    id: 'exp_4',
    branchId: 'br_1',
    category: 'CLEANING',
    title: 'Sanitization & Daily Housekeeping Supplies',
    amount: 4200,
    date: addDays(today, -3),
    paymentMethod: 'CASH',
    recordedBy: 'Karan Mehra',
  },
  {
    id: 'exp_5',
    branchId: 'br_1',
    category: 'TEA_COFFEE',
    title: 'Automated Beverage Vending Machine Beans & Milk',
    amount: 2800,
    date: addDays(today, -2),
    paymentMethod: 'UPI_GPAY',
    recordedBy: 'Karan Mehra',
  },
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wt_1',
    memberId: 'mem_8',
    branchId: 'br_1',
    preferredShiftId: 'sh_1', // Morning shift waitlist
    preferredSeatId: 'seat_a_1',
    priority: 1,
    status: 'WAITING',
    requestedAt: addDays(today, -2),
  },
];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'notif_1',
    memberId: 'mem_2',
    memberName: 'Priya Nair',
    phone: '+91 98201 11002',
    type: 'EXPIRY_REMINDER_3D',
    channel: 'WHATSAPP',
    message: 'Membership expiring in 2 days for Seat A-02 at Dadar Hub.',
    sentAt: `${today} 09:00`,
    status: 'SENT',
  },
];
