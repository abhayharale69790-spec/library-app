export type Role = 'OWNER' | 'ADMIN' | 'STAFF' | 'STUDENT';

export type MembershipStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'REFUNDED';
export type SeatAssignmentStatus = 'ACTIVE' | 'TRANSFERRED' | 'EXPIRED' | 'RELEASED';
export type SeatStatus = 'ACTIVE' | 'MAINTENANCE' | 'BLOCKED';
export type SeatZone = 'AC Quiet' | 'Standard' | 'Deluxe Cubicle' | 'Discussion';
export type SeatType = 'FIXED' | 'FLOATING';

export type PaymentMethod = 
  | 'CASH' 
  | 'UPI_GPAY' 
  | 'UPI_PHONEPE' 
  | 'UPI_PAYTM' 
  | 'CARD' 
  | 'NETBANKING';

export type ExpenseCategory = 
  | 'RENT' 
  | 'ELECTRICITY' 
  | 'WIFI_INTERNET' 
  | 'CLEANING' 
  | 'MAINTENANCE' 
  | 'SALARY' 
  | 'TEA_COFFEE' 
  | 'OTHER';

export interface Organization {
  id: string;
  name: string;
  tagline: string;
  subscriptionPlan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  contactEmail: string;
  supportPhone: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  orgId: string;
  name: string;
  code: string; // e.g. 'MUM-01'
  address: string;
  phone: string;
  contactPerson: string;
  capacity: number;
  active: boolean;
}

export interface Shift {
  id: string;
  branchId: string;
  name: string; // e.g. 'Morning (6 AM - 12 PM)', 'Afternoon', 'Evening', 'Night Owl', 'Full Day (24h)'
  startTime: string; // '06:00'
  endTime: string;   // '12:00'
  defaultPrice: number;
  color: string;
  active: boolean;
  order: number;
}

export interface Seat {
  id: string;
  branchId: string;
  label: string; // e.g. 'A-01', 'B-12'
  row: number;
  col: number;
  zone: SeatZone;
  type: SeatType;
  status: SeatStatus;
  isBlocked?: boolean;
  blockReason?: string;
  powerSocket: boolean;
  hasLocker: boolean;
}

export interface MembershipPlan {
  id: string;
  name: string; // e.g. 'Monthly Standard', 'Quarterly Pro', 'Half-Yearly Elite', 'Annual Scholar'
  durationDays: number;
  basePrice: number;
  description: string;
  features: string[];
}

export interface Member {
  id: string;
  memberCode: string; // e.g. '24L-MUM-1001'
  branchId: string;
  fullName: string;
  phone: string;
  email: string;
  emergencyContact: string;
  idProofNumber?: string;
  targetExam?: string; // e.g. 'UPSC Civil Services', 'CA Final', 'NEET PG', 'GATE CSE', 'General Study'
  photoUrl?: string;
  joinedDate: string;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'BLOCKED';
  notes?: string;
  qrToken: string;
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  branchId: string;
  shiftId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: MembershipStatus;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  autoRenew: boolean;
  lastRenewedAt?: string;
}

export interface SeatAssignment {
  id: string;
  memberId: string;
  seatId: string;
  shiftId: string;
  branchId: string;
  membershipId: string;
  startDate: string;
  endDate: string;
  status: SeatAssignmentStatus;
  assignedAt: string;
}

export interface Payment {
  id: string;
  receiptNo: string; // 'RCP-2026-0081'
  memberId: string;
  membershipId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD HH:mm
  method: PaymentMethod;
  referenceTxnId?: string;
  notes?: string;
  invoiceUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  branchId: string;
  shiftId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string;
  durationMinutes?: number;
  method: 'QR_SCAN' | 'MANUAL_STAFF' | 'BIOMETRIC';
  status: 'INSIDE' | 'COMPLETED' | 'AUTO_CHECKOUT';
}

export interface AccessLog {
  id: string;
  memberId?: string;
  memberCode?: string;
  memberName?: string;
  branchId: string;
  timestamp: string;
  result: 'ALLOWED' | 'DENIED';
  reason: string;
  gateId: string;
  shiftId?: string;
}

export interface WaitlistEntry {
  id: string;
  memberId: string;
  branchId: string;
  preferredShiftId: string;
  preferredSeatId?: string;
  priority: number;
  status: 'WAITING' | 'OFFERED' | 'CONVERTED' | 'EXPIRED';
  requestedAt: string;
}

export interface Expense {
  id: string;
  branchId: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string;
  paymentMethod: string;
  recordedBy: string;
  receiptRef?: string;
}

export interface NotificationLog {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  type: 'EXPIRY_REMINDER_7D' | 'EXPIRY_REMINDER_3D' | 'EXPIRY_TODAY' | 'OVERDUE_ALERT' | 'SEAT_ASSIGNED' | 'PAYMENT_RECEIPT';
  channel: 'WHATSAPP' | 'SMS';
  message: string;
  sentAt: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
}

export interface FilterOptions {
  searchQuery: string;
  branchId: string;
  statusFilter: 'ALL' | 'ACTIVE' | 'EXPIRING_1_7' | 'EXPIRING_8_15' | 'EXPIRED' | 'OVERDUE';
  shiftId?: string;
  zoneFilter?: string;
}

export interface TestResult {
  id: string;
  testNumber: number;
  title: string;
  category: 'CONCURRENCY' | 'SEAT_MATRIX' | 'MEMBERSHIP' | 'PAYMENT' | 'QR_GATE' | 'ATTENDANCE' | 'BRANCH';
  description: string;
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  expected: string;
  actual?: string;
  logs: string[];
}
