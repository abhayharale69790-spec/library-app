export type Role = 'OWNER' | 'ADMIN' | 'STAFF' | 'STUDENT';

export type MembershipStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'REFUNDED';
export type SeatAssignmentStatus = 'ACTIVE' | 'TRANSFERRED' | 'EXPIRED' | 'RELEASED';
export type SeatStatus = 'ACTIVE' | 'MAINTENANCE' | 'BLOCKED';
export type SeatZone = 'Standard' | 'AC' | 'Premium' | 'Cabin' | 'Discussion' | 'AC Quiet' | 'Deluxe Cubicle';
export type SeatType = 'FIXED' | 'FLOATING';

export type PaymentMethod = 
  | 'CASH' 
  | 'UPI'
  | 'UPI_GPAY' 
  | 'UPI_PHONEPE' 
  | 'UPI_PAYTM' 
  | 'CARD' 
  | 'BANK_TRANSFER'
  | 'NETBANKING'
  | 'OTHER';

export type ExpenseCategory = 
  | 'RENT' 
  | 'ELECTRICITY' 
  | 'WIFI_INTERNET' 
  | 'CLEANING' 
  | 'MAINTENANCE' 
  | 'SALARY' 
  | 'TEA_COFFEE' 
  | 'OTHER';

export type BusinessType = 
  | 'Library' 
  | 'Study Center' 
  | 'Reading Room' 
  | 'Study Hall' 
  | 'Abhyasika' 
  | 'Co-Learning Space' 
  | 'Custom';

export type SeatNamingStyle = 'NUMERIC' | 'ALPHA_NUMERIC' | 'CUSTOM';

export interface BusinessProfile {
  id: string;
  name: string; // e.g. "Harale Study Point & Abhyasika"
  type: BusinessType;
  shortName: string; // e.g. "HSP"
  tagline: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  location?: string;
  receiptPrefix: string; // e.g. "HSP-"
  currencySymbol: string; // "₹"
  gracePeriodMinutes: number; // default: 15
  requireCheckout: boolean; // default: true
  enable7dReminder: boolean;
  enable3dReminder: boolean;
  enable1dReminder: boolean;
  workingDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  terminology: {
    studentLabel: string; // "Student" | "Member" | "Scholar"
    seatLabel: string;    // "Seat" | "Desk" | "Cubicle"
    planLabel: string;    // "Plan" | "Membership" | "Pass"
    branchLabel: string;  // "Branch" | "Center" | "Hall"
  };
  isConfigured: boolean;
  createdAt: string;
}

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
  name: string; // e.g. 'Morning (6 AM - 12 PM)', 'Evening', 'Full Day (24h)'
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
  label: string; // e.g. 'A-01', '01', 'B-12'
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
  name: string; // e.g. 'Monthly Standard', 'Quarterly Pro', 'Annual Scholar'
  durationDays: number;
  basePrice: number;
  description: string;
  features: string[];
}

export interface Member {
  id: string;
  memberCode: string; // e.g. 'MEM-1001'
  branchId: string;
  fullName: string;
  phone: string;
  email: string;
  emergencyContact: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  idProofNumber?: string;
  targetExam?: string; // e.g. 'UPSC Civil Services', 'MPSC', 'CA Final', 'NEET PG', 'General Study'
  photoUrl?: string;
  joinedDate: string;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'BLOCKED';
  notes?: string;
  qrToken: string;
}

export interface Membership {
  id: string;
  memberId: string;
  branchId: string;
  planId: string;
  shiftId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  status: MembershipStatus;
  paymentStatus: PaymentStatus;
  autoRenew: boolean;
  assignedSeatId?: string;
  createdAt?: string;
}

export interface SeatAssignment {
  id: string;
  seatId: string;
  memberId: string;
  shiftId: string;
  startDate: string;
  endDate: string;
  status: SeatAssignmentStatus;
  assignedAt: string;
}

export interface Payment {
  id: string;
  receiptNo: string; // e.g. 'RCP-2026-0001'
  memberId: string;
  membershipId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: PaymentMethod;
  status: PaymentStatus;
  referenceTxnId?: string;
  notes?: string;
  recordedBy: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string; // HH:mm:ss
  durationMinutes?: number;
  gateId: string;
  seatLabel?: string;
  status: 'INSIDE' | 'COMPLETED' | 'AUTO_CHECKOUT';
}

export interface AccessLog {
  id: string;
  timestamp: string;
  memberId?: string;
  memberName?: string;
  memberCode?: string;
  branchId: string;
  gateId: string;
  action: 'ENTRY' | 'EXIT' | 'DENIED';
  result: 'ALLOWED' | 'DENIED';
  reason: string;
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

export interface SetupWizardData {
  businessName: string;
  businessType: BusinessType;
  shortName: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  address: string;
  branchName: string;
  totalSeats: number;
  seatNamingStyle: SeatNamingStyle;
  customPrefix?: string;
  shifts: { name: string; startTime: string; endTime: string; defaultPrice: number }[];
  plans: { name: string; durationDays: number; basePrice: number }[];
}
