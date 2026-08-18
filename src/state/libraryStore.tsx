import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  Role,
} from '../types';
import {
  INITIAL_ORG,
  INITIAL_BRANCHES,
  INITIAL_SHIFTS,
  INITIAL_PLANS,
  INITIAL_SEATS,
  INITIAL_MEMBERS,
  INITIAL_MEMBERSHIPS,
  INITIAL_ASSIGNMENTS,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_ACCESS_LOGS,
  INITIAL_EXPENSES,
  INITIAL_WAITLIST,
  INITIAL_NOTIFICATIONS,
} from './initialData';
import {
  getTodayString,
  getCurrentTimeString,
  getCurrentTimestampString,
  addDays,
  getDaysRemaining,
  calculateRenewalDates,
  isTimeInShift,
  doDateRangesOverlap,
} from '../utils/dateMath';
import { generateMemberQRToken, parseQRToken } from '../utils/qrGenerator';
import { audioSynth } from '../utils/audioSynth';
import { buildWhatsAppLink, generateWhatsAppMessage } from '../utils/whatsappHelper';
import { getSupabaseClient, getSupabaseConfig, testSupabaseConnection } from '../lib/supabaseClient';
import { pushDatasetToCloud, pullDatasetFromCloud, FullDataset } from './cloudSyncAdapter';

const STORAGE_KEY = '24LIBRARY_STORAGE_V1';

export interface GateScanResult {
  allowed: boolean;
  action: 'CHECK_IN' | 'CHECK_OUT' | 'DENIED';
  reason: string;
  member?: Member;
  membership?: Membership;
  shift?: Shift;
  seat?: Seat;
  durationMinutes?: number;
}

interface LibraryContextType {
  // Master State
  org: Organization;
  branches: Branch[];
  currentBranchId: string;
  setCurrentBranchId: (id: string) => void;
  currentBranch: Branch;
  shifts: Shift[];
  plans: MembershipPlan[];
  seats: Seat[];
  members: Member[];
  memberships: Membership[];
  assignments: SeatAssignment[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  accessLogs: AccessLog[];
  expenses: Expense[];
  waitlist: WaitlistEntry[];
  notifications: NotificationLog[];

  // App & View State
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  simulatedClockTime: string; // HH:mm
  setSimulatedClockTime: (time: string) => void;
  selectedShiftFilter: string; // 'ALL' | shiftId
  setSelectedShiftFilter: (shiftId: string) => void;
  selectedDateFilter: string;  // YYYY-MM-DD
  setSelectedDateFilter: (date: string) => void;

  // Real-time Computed Stats
  insideAttendanceCount: number;
  branchOccupancyRate: number;

  // Cloud Database Sync State & Methods
  isCloudConnected: boolean;
  isSyncingCloud: boolean;
  cloudSyncStatusText: string;
  syncToCloud: () => Promise<{ success: boolean; error?: string }>;
  syncFromCloud: () => Promise<{ success: boolean; error?: string }>;
  refreshCloudStatus: () => Promise<boolean>;

  // Actions
  addMember: (data: {
    fullName: string;
    phone: string;
    email: string;
    emergencyContact: string;
    targetExam?: string;
    planId: string;
    shiftId: string;
    seatId?: string;
    amountPaid: number;
    paymentMethod: Payment['method'];
  }) => { success: boolean; member?: Member; error?: string };
  
  updateMember: (memberId: string, data: Partial<Member>) => void;
  
  assignSeat: (
    memberId: string,
    seatId: string,
    shiftId: string,
    startDate: string,
    endDate: string
  ) => { success: boolean; error?: string };
  
  transferSeat: (
    memberId: string,
    targetSeatId: string,
    shiftId: string
  ) => { success: boolean; error?: string };
  
  blockSeat: (seatId: string, reason: string) => { success: boolean; error?: string };
  unblockSeat: (seatId: string) => { success: boolean; error?: string };
  
  renewMembership: (
    memberId: string,
    planId: string,
    shiftId: string,
    amountPaid: number,
    paymentMethod: Payment['method']
  ) => { success: boolean; error?: string };
  
  recordPayment: (
    memberId: string,
    amount: number,
    method: Payment['method'],
    reference?: string,
    notes?: string
  ) => { success: boolean; receipt?: Payment; error?: string };
  
  scanGateQR: (qrPayload: string, gateId?: string) => GateScanResult;
  manualCheckInOut: (memberId: string) => GateScanResult;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;

  addShift: (shift: Omit<Shift, 'id' | 'order'>) => void;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;

  transferBranch: (memberId: string, newBranchId: string) => { success: boolean; error?: string };

  sendWhatsAppNotification: (
    memberId: string,
    type: 'EXPIRY_REMINDER_7D' | 'EXPIRY_REMINDER_3D' | 'EXPIRY_TODAY' | 'OVERDUE_ALERT' | 'SEAT_ASSIGNED' | 'PAYMENT_RECEIPT'
  ) => { url: string; log: NotificationLog };

  // System
  resetToDemoData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from LocalStorage if available
  const [org] = useState<Organization>(INITIAL_ORG);
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_branches');
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });
  const [currentBranchId, setCurrentBranchId] = useState<string>('br_1');

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_shifts');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [plans, setPlans] = useState<MembershipPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_plans');
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });

  const [seats, setSeats] = useState<Seat[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_seats');
    return saved ? JSON.parse(saved) : INITIAL_SEATS;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [memberships, setMemberships] = useState<Membership[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_memberships');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERSHIPS;
  });

  const [assignments, setAssignments] = useState<SeatAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_assignments');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_accessLogs');
    return saved ? JSON.parse(saved) : INITIAL_ACCESS_LOGS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_waitlist');
    return saved ? JSON.parse(saved) : INITIAL_WAITLIST;
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Cloud Database Sync State
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudSyncStatusText, setCloudSyncStatusText] = useState<string>('Local Storage Mode');

  // App active role & simulation time
  const [activeRole, setActiveRole] = useState<Role>('ADMIN');
  const [simulatedClockTime, setSimulatedClockTime] = useState<string>(() => getCurrentTimeString());
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('sh_1');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(() => getTodayString());

  // Auto-sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_branches', JSON.stringify(branches));
    localStorage.setItem(STORAGE_KEY + '_shifts', JSON.stringify(shifts));
    localStorage.setItem(STORAGE_KEY + '_plans', JSON.stringify(plans));
    localStorage.setItem(STORAGE_KEY + '_seats', JSON.stringify(seats));
    localStorage.setItem(STORAGE_KEY + '_members', JSON.stringify(members));
    localStorage.setItem(STORAGE_KEY + '_memberships', JSON.stringify(memberships));
    localStorage.setItem(STORAGE_KEY + '_assignments', JSON.stringify(assignments));
    localStorage.setItem(STORAGE_KEY + '_payments', JSON.stringify(payments));
    localStorage.setItem(STORAGE_KEY + '_attendance', JSON.stringify(attendance));
    localStorage.setItem(STORAGE_KEY + '_accessLogs', JSON.stringify(accessLogs));
    localStorage.setItem(STORAGE_KEY + '_expenses', JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEY + '_waitlist', JSON.stringify(waitlist));
    localStorage.setItem(STORAGE_KEY + '_notifications', JSON.stringify(notifications));
  }, [branches, shifts, plans, seats, members, memberships, assignments, payments, attendance, accessLogs, expenses, waitlist, notifications]);

  // Current active branch object
  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];

  // Real-time occupancy calculation
  const insideAttendanceCount = attendance.filter(
    a => a.branchId === currentBranchId && a.status === 'INSIDE' && a.date === getTodayString()
  ).length;

  const branchSeats = seats.filter(s => s.branchId === currentBranchId);
  const branchOccupancyRate = branchSeats.length > 0 
    ? Math.min(100, Math.round((insideAttendanceCount / branchSeats.length) * 100))
    : 0;

  // Cloud Database Sync Handlers
  const refreshCloudStatus = useCallback(async (): Promise<boolean> => {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) {
      setIsCloudConnected(false);
      setCloudSyncStatusText('Local Storage Standalone');
      return false;
    }

    const res = await testSupabaseConnection(url, anonKey);
    setIsCloudConnected(res.success);
    setCloudSyncStatusText(res.success ? 'Connected to Cloud PostgreSQL' : `Cloud Offline: ${res.message}`);
    return res.success;
  }, []);

  // Initial check on mount
  useEffect(() => {
    refreshCloudStatus();
  }, [refreshCloudStatus]);

  // Setup Real-time listener if Supabase client is active
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !isCloudConnected) return;

    try {
      const channel = client
        .channel('public:realtime_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as Record<string, unknown>;
            const newAtt: AttendanceRecord = {
              id: String(newRow.id),
              memberId: String(newRow.member_id),
              branchId: String(newRow.branch_id),
              shiftId: String(newRow.shift_id),
              date: String(newRow.date),
              checkInTime: String(newRow.check_in_time),
              checkOutTime: newRow.check_out_time ? String(newRow.check_out_time) : undefined,
              durationMinutes: newRow.duration_minutes ? Number(newRow.duration_minutes) : undefined,
              method: newRow.method as AttendanceRecord['method'],
              status: newRow.status as AttendanceRecord['status'],
            };
            setAttendance(prev => {
              if (prev.some(a => a.id === newAtt.id)) return prev;
              return [newAtt, ...prev];
            });
          }
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime channel error:', e);
    }
  }, [isCloudConnected]);

  const syncToCloud = async () => {
    setIsSyncingCloud(true);
    const dataset: FullDataset = {
      branches,
      shifts,
      plans,
      seats,
      members,
      memberships,
      assignments,
      payments,
      attendance,
      accessLogs,
      expenses,
    };
    const res = await pushDatasetToCloud(dataset);
    setIsSyncingCloud(false);
    if (res.success) {
      setIsCloudConnected(true);
      setCloudSyncStatusText('Synced to Supabase');
    }
    return res;
  };

  const syncFromCloud = async () => {
    setIsSyncingCloud(true);
    const res = await pullDatasetFromCloud();
    setIsSyncingCloud(false);
    if (res.success && res.data) {
      if (res.data.branches) setBranches(res.data.branches);
      if (res.data.shifts) setShifts(res.data.shifts);
      if (res.data.seats) setSeats(res.data.seats);
      if (res.data.members) setMembers(res.data.members);
      if (res.data.memberships) setMemberships(res.data.memberships);
      if (res.data.assignments) setAssignments(res.data.assignments);
      if (res.data.payments) setPayments(res.data.payments);
      if (res.data.attendance) setAttendance(res.data.attendance);
      setIsCloudConnected(true);
      setCloudSyncStatusText('Loaded from Supabase');
    }
    return { success: res.success, error: res.error };
  };

  // -------------------------------------------------------------
  // CORE BUSINESS ENGINE ACTIONS
  // -------------------------------------------------------------

  // 1. Add Member with Zero-Conflict Seat Assignment & Initial Payment
  const addMember = (data: {
    fullName: string;
    phone: string;
    email: string;
    emergencyContact: string;
    targetExam?: string;
    planId: string;
    shiftId: string;
    seatId?: string;
    amountPaid: number;
    paymentMethod: Payment['method'];
  }) => {
    if (!data.fullName.trim()) return { success: false, error: 'Full name is required.' };
    if (!data.phone.trim()) return { success: false, error: 'Phone number is required.' };
    
    // Duplicate Phone Check
    const cleanPhone = data.phone.replace(/[^0-9]/g, '');
    const phoneExists = members.some(m => m.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (phoneExists) {
      return { success: false, error: `A member with phone number ${data.phone} already exists.` };
    }

    const plan = plans.find(p => p.id === data.planId);
    if (!plan) return { success: false, error: 'Selected membership plan not found.' };

    const shift = shifts.find(s => s.id === data.shiftId);
    if (!shift) return { success: false, error: 'Selected shift not found.' };

    const today = getTodayString();
    const startDate = today;
    const endDate = addDays(today, plan.durationDays);
    const memberId = 'mem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const codeNum = 1000 + members.length + 1;
    const memberCode = `24L-${currentBranch.code}-${codeNum}`;
    const qrToken = generateMemberQRToken(memberCode, memberId, currentBranchId);

    // If seat chosen, perform Conflict Check!
    if (data.seatId) {
      const seat = seats.find(s => s.id === data.seatId);
      if (!seat) return { success: false, error: 'Selected seat does not exist.' };
      if (seat.isBlocked || seat.status === 'BLOCKED') {
        return { success: false, error: `Seat ${seat.label} is currently blocked: ${seat.blockReason || 'Maintenance'}` };
      }

      // Check overlapping assignment on SAME seat + SAME shift
      const conflict = assignments.find(
        a => a.seatId === data.seatId &&
             a.shiftId === data.shiftId &&
             a.status === 'ACTIVE' &&
             doDateRangesOverlap(a.startDate, a.endDate, startDate, endDate)
      );

      if (conflict) {
        const conflictingMember = members.find(m => m.id === conflict.memberId);
        return {
          success: false,
          error: `CONFLICT: Seat ${seat.label} is already reserved for ${conflictingMember?.fullName || 'another member'} during this shift.`,
        };
      }
    }

    const totalFee = plan.basePrice;
    const dueAmount = Math.max(0, totalFee - data.amountPaid);
    const paymentStatus: Membership['paymentStatus'] = dueAmount === 0 ? 'PAID' : 'PARTIAL';

    const newMember: Member = {
      id: memberId,
      memberCode,
      branchId: currentBranchId,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      emergencyContact: data.emergencyContact.trim(),
      targetExam: data.targetExam || 'General Study',
      joinedDate: today,
      status: 'ACTIVE',
      qrToken,
    };

    const membershipId = 'msh_' + Date.now().toString(36);
    const newMembership: Membership = {
      id: membershipId,
      memberId,
      planId: plan.id,
      branchId: currentBranchId,
      shiftId: shift.id,
      startDate,
      endDate,
      status: 'ACTIVE',
      totalFee,
      paidAmount: data.amountPaid,
      dueAmount,
      paymentStatus,
      autoRenew: false,
    };

    let newAssignment: SeatAssignment | null = null;
    if (data.seatId) {
      newAssignment = {
        id: 'asgn_' + Date.now().toString(36),
        memberId,
        seatId: data.seatId,
        shiftId: shift.id,
        branchId: currentBranchId,
        membershipId,
        startDate,
        endDate,
        status: 'ACTIVE',
        assignedAt: today,
      };
    }

    let newPayment: Payment | null = null;
    if (data.amountPaid > 0) {
      const receiptNo = `RCP-2026-${String(payments.length + 101).padStart(4, '0')}`;
      newPayment = {
        id: 'pay_' + Date.now().toString(36),
        receiptNo,
        memberId,
        membershipId,
        amount: data.amountPaid,
        paymentDate: `${today} ${getCurrentTimeString()}`,
        method: data.paymentMethod,
        notes: 'Initial admission & seat booking fee.',
      };
    }

    // Atomic local update
    setMembers(prev => [newMember, ...prev]);
    setMemberships(prev => [newMembership, ...prev]);
    if (newAssignment) setAssignments(prev => [newAssignment!, ...prev]);
    if (newPayment) setPayments(prev => [newPayment!, ...prev]);

    return { success: true, member: newMember };
  };

  const updateMember = (memberId: string, data: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...data } : m));
  };

  // 2. Assign Seat with Shift-Aware Overlap Validation
  const assignSeat = (
    memberId: string,
    seatId: string,
    shiftId: string,
    startDate: string,
    endDate: string
  ) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return { success: false, error: 'Seat not found.' };
    if (seat.isBlocked || seat.status === 'BLOCKED') {
      return { success: false, error: `Seat ${seat.label} is blocked: ${seat.blockReason || 'Under maintenance'}` };
    }

    const member = members.find(m => m.id === memberId);
    if (!member) return { success: false, error: 'Member not found.' };

    const activeMembership = memberships.find(m => m.memberId === memberId && m.status !== 'CANCELLED');
    if (!activeMembership) return { success: false, error: 'Member has no valid membership.' };

    // Strict Conflict Check: Same seat + Same shift + Overlapping Dates
    const conflict = assignments.find(
      a => a.seatId === seatId &&
           a.shiftId === shiftId &&
           a.status === 'ACTIVE' &&
           a.memberId !== memberId &&
           doDateRangesOverlap(a.startDate, a.endDate, startDate, endDate)
    );

    if (conflict) {
      const occupant = members.find(m => m.id === conflict.memberId);
      return {
        success: false,
        error: `CONFLICT: Seat ${seat.label} is already assigned to ${occupant?.fullName || 'another student'} for this shift.`,
      };
    }

    const updatedAssignments = assignments.map(a => {
      if (a.memberId === memberId && a.status === 'ACTIVE') {
        return { ...a, status: 'TRANSFERRED' as const };
      }
      return a;
    });

    const newAssignment: SeatAssignment = {
      id: 'asgn_' + Date.now().toString(36),
      memberId,
      seatId,
      shiftId,
      branchId: currentBranchId,
      membershipId: activeMembership.id,
      startDate,
      endDate,
      status: 'ACTIVE',
      assignedAt: getTodayString(),
    };

    setAssignments([newAssignment, ...updatedAssignments]);
    return { success: true };
  };

  // 3. Seat Transfer
  const transferSeat = (memberId: string, targetSeatId: string, shiftId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return { success: false, error: 'Member not found.' };

    const membership = memberships.find(m => m.memberId === memberId && m.status === 'ACTIVE');
    if (!membership) return { success: false, error: 'No active membership found.' };

    return assignSeat(memberId, targetSeatId, shiftId, membership.startDate, membership.endDate);
  };

  // 4. Block / Unblock Seat
  const blockSeat = (seatId: string, reason: string) => {
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, isBlocked: true, status: 'BLOCKED', blockReason: reason } : s));
    return { success: true };
  };

  const unblockSeat = (seatId: string) => {
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, isBlocked: false, status: 'ACTIVE', blockReason: undefined } : s));
    return { success: true };
  };

  // 5. Renewal Engine with Exact Expiry Rollover Arithmetic
  const renewMembership = (
    memberId: string,
    planId: string,
    shiftId: string,
    amountPaid: number,
    paymentMethod: Payment['method']
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return { success: false, error: 'Member not found.' };

    const plan = plans.find(p => p.id === planId);
    if (!plan) return { success: false, error: 'Plan not found.' };

    const currentMembership = memberships.find(m => m.memberId === memberId);
    const currentEnd = currentMembership?.endDate || getTodayString();
    
    // Core Arithmetic: Active extends old end date; Expired restarts from today
    const { startDate, endDate } = calculateRenewalDates(currentEnd, plan.durationDays);

    const totalFee = plan.basePrice;
    const dueAmount = Math.max(0, totalFee - amountPaid);
    const paymentStatus: Membership['paymentStatus'] = dueAmount === 0 ? 'PAID' : 'PARTIAL';

    const membershipId = currentMembership?.id || ('msh_' + Date.now().toString(36));
    const updatedMembership: Membership = {
      id: membershipId,
      memberId,
      planId: plan.id,
      branchId: currentBranchId,
      shiftId,
      startDate,
      endDate,
      status: 'ACTIVE',
      totalFee,
      paidAmount: (currentMembership?.paidAmount || 0) + amountPaid,
      dueAmount,
      paymentStatus,
      autoRenew: false,
      lastRenewedAt: getTodayString(),
    };

    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'ACTIVE' } : m));
    
    setMemberships(prev => {
      const exists = prev.some(m => m.id === membershipId);
      if (exists) {
        return prev.map(m => m.id === membershipId ? updatedMembership : m);
      }
      return [updatedMembership, ...prev];
    });

    if (amountPaid > 0) {
      const receiptNo = `RCP-2026-${String(payments.length + 101).padStart(4, '0')}`;
      const newPayment: Payment = {
        id: 'pay_' + Date.now().toString(36),
        receiptNo,
        memberId,
        membershipId,
        amount: amountPaid,
        paymentDate: `${getTodayString()} ${getCurrentTimeString()}`,
        method: paymentMethod,
        notes: `Renewal for ${plan.name} (${plan.durationDays} days)`,
      };
      setPayments(prev => [newPayment, ...prev]);
    }

    setAssignments(prev => prev.map(a => {
      if (a.memberId === memberId && a.status === 'ACTIVE') {
        return { ...a, endDate, shiftId };
      }
      return a;
    }));

    audioSynth.playPaymentSuccess();
    return { success: true };
  };

  // 6. Record Fee Payment / Clear Outstanding Dues
  const recordPayment = (
    memberId: string,
    amount: number,
    method: Payment['method'],
    reference?: string,
    notes?: string
  ) => {
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than 0.' };

    const member = members.find(m => m.id === memberId);
    if (!member) return { success: false, error: 'Member not found.' };

    const membership = memberships.find(m => m.memberId === memberId && m.status !== 'CANCELLED');
    if (!membership) return { success: false, error: 'No membership found for member.' };

    const receiptNo = `RCP-2026-${String(payments.length + 101).padStart(4, '0')}`;
    const newPayment: Payment = {
      id: 'pay_' + Date.now().toString(36),
      receiptNo,
      memberId,
      membershipId: membership.id,
      amount,
      paymentDate: `${getTodayString()} ${getCurrentTimeString()}`,
      method,
      referenceTxnId: reference,
      notes: notes || 'Fee installment / clearance',
    };

    const newPaid = membership.paidAmount + amount;
    const newDue = Math.max(0, membership.totalFee - newPaid);
    const newStatus: Membership['paymentStatus'] = newDue === 0 ? 'PAID' : 'PARTIAL';

    setMemberships(prev => prev.map(m => m.id === membership.id ? {
      ...m,
      paidAmount: newPaid,
      dueAmount: newDue,
      paymentStatus: newStatus,
    } : m));

    setPayments(prev => [newPayment, ...prev]);
    audioSynth.playPaymentSuccess();

    return { success: true, receipt: newPayment };
  };

  // 7. QR Gate Hardware Access State Machine
  const scanGateQR = (qrPayload: string, gateId = 'GATE-01 (Turnstile Alpha)'): GateScanResult => {
    const today = getTodayString();
    const nowTime = simulatedClockTime || getCurrentTimeString();
    const timestamp = getCurrentTimestampString();

    const parsed = parseQRToken(qrPayload);
    let member: Member | undefined;

    if (parsed.isValid && parsed.memberId) {
      member = members.find(m => m.id === parsed.memberId || m.memberCode === parsed.memberCode);
    } else {
      member = members.find(m => m.memberCode === qrPayload.trim() || m.id === qrPayload.trim());
    }

    if (!member) {
      audioSynth.playAccessDenied();
      const log: AccessLog = {
        id: 'log_' + Date.now().toString(36),
        branchId: currentBranchId,
        timestamp,
        result: 'DENIED',
        reason: 'INVALID_QR: Token signature or Member ID not recognized.',
        gateId,
      };
      setAccessLogs(prev => [log, ...prev]);
      return { allowed: false, action: 'DENIED', reason: 'Invalid or Unrecognized QR Code.' };
    }

    // Branch Verification
    if (member.branchId !== currentBranchId) {
      const homeBranch = branches.find(b => b.id === member.branchId)?.name || 'Other Branch';
      audioSynth.playAccessDenied();
      const log: AccessLog = {
        id: 'log_' + Date.now().toString(36),
        memberId: member.id,
        memberCode: member.memberCode,
        memberName: member.fullName,
        branchId: currentBranchId,
        timestamp,
        result: 'DENIED',
        reason: `WRONG_BRANCH: Member belongs to ${homeBranch}`,
        gateId,
      };
      setAccessLogs(prev => [log, ...prev]);
      return { allowed: false, action: 'DENIED', reason: `Access Denied: Registered at ${homeBranch}.`, member };
    }

    // Membership & Expiry Verification
    const membership = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
    if (!membership) {
      audioSynth.playAccessDenied();
      const log: AccessLog = {
        id: 'log_' + Date.now().toString(36),
        memberId: member.id,
        memberCode: member.memberCode,
        memberName: member.fullName,
        branchId: currentBranchId,
        timestamp,
        result: 'DENIED',
        reason: 'NO_MEMBERSHIP: No membership record found.',
        gateId,
      };
      setAccessLogs(prev => [log, ...prev]);
      return { allowed: false, action: 'DENIED', reason: 'Access Denied: No active membership.', member };
    }

    const daysLeft = getDaysRemaining(membership.endDate);
    if (daysLeft < 0 || membership.status === 'EXPIRED' || member.status === 'EXPIRED') {
      audioSynth.playAccessDenied();
      const log: AccessLog = {
        id: 'log_' + Date.now().toString(36),
        memberId: member.id,
        memberCode: member.memberCode,
        memberName: member.fullName,
        branchId: currentBranchId,
        timestamp,
        result: 'DENIED',
        reason: `MEMBERSHIP_EXPIRED: Expired on ${membership.endDate} (${Math.abs(daysLeft)} days ago)`,
        gateId,
      };
      setAccessLogs(prev => [log, ...prev]);
      return { allowed: false, action: 'DENIED', reason: `Access Denied: Membership expired on ${membership.endDate}.`, member, membership };
    }

    // Shift & Timing Verification
    const memberShift = shifts.find(s => s.id === membership.shiftId);
    const assignment = assignments.find(a => a.memberId === member.id && a.status === 'ACTIVE');
    const seat = seats.find(s => s.id === assignment?.seatId);

    const isFullDay = memberShift?.startTime === '00:00' && memberShift?.endTime === '23:59';
    const shiftValidNow = isFullDay || (memberShift && isTimeInShift(nowTime, memberShift.startTime, memberShift.endTime, 15));

    if (!shiftValidNow && memberShift) {
      audioSynth.playAccessDenied();
      const log: AccessLog = {
        id: 'log_' + Date.now().toString(36),
        memberId: member.id,
        memberCode: member.memberCode,
        memberName: member.fullName,
        branchId: currentBranchId,
        timestamp,
        result: 'DENIED',
        reason: `WRONG_SHIFT: Allowed shift is ${memberShift.name} (${memberShift.startTime} - ${memberShift.endTime}). Current time: ${nowTime}`,
        gateId,
        shiftId: memberShift.id,
      };
      setAccessLogs(prev => [log, ...prev]);
      return {
        allowed: false,
        action: 'DENIED',
        reason: `Access Denied: Allowed shift is ${memberShift.name} (${memberShift.startTime} to ${memberShift.endTime}). Current time: ${nowTime}`,
        member,
        membership,
        shift: memberShift,
        seat,
      };
    }

    // Anti-Passback / Check-In vs Check-Out State Machine
    const openSession = attendance.find(
      a => a.memberId === member.id && a.branchId === currentBranchId && a.status === 'INSIDE' && a.date === today
    );

    if (openSession) {
      // Check-Out
      const checkInParts = openSession.checkInTime.split(':').map(n => parseInt(n, 10));
      const nowParts = nowTime.split(':').map(n => parseInt(n, 10));
      const inMinutes = checkInParts[0] * 60 + checkInParts[1];
      const outMinutes = nowParts[0] * 60 + nowParts[1];
      const durationMinutes = Math.max(1, outMinutes - inMinutes);

      setAttendance(prev => prev.map(a => a.id === openSession.id ? {
        ...a,
        checkOutTime: nowTime + ':00',
        durationMinutes,
        status: 'COMPLETED' as const,
      } : a));

      audioSynth.playCheckout();

      const log: AccessLog = {
        id: 'log_' + Date.now().toString(36),
        memberId: member.id,
        memberCode: member.memberCode,
        memberName: member.fullName,
        branchId: currentBranchId,
        timestamp,
        result: 'ALLOWED',
        reason: `CHECK_OUT: Successfully checked out. Study session: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m.`,
        gateId,
        shiftId: memberShift?.id,
      };
      setAccessLogs(prev => [log, ...prev]);

      return {
        allowed: true,
        action: 'CHECK_OUT',
        reason: `Check-out successful. Study session: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m.`,
        member,
        membership,
        shift: memberShift,
        seat,
        durationMinutes,
      };
    } else {
      // Check-In
      const newAttendance: AttendanceRecord = {
        id: 'att_' + Date.now().toString(36),
        memberId: member.id,
        branchId: currentBranchId,
        shiftId: membership.shiftId,
        date: today,
        checkInTime: nowTime + ':00',
        method: 'QR_SCAN',
        status: 'INSIDE',
      };

      setAttendance(prev => [newAttendance, ...prev]);
      audioSynth.playAccessGranted();

      const log: AccessLog = {
        id: 'log_' + Date.now().toString(36),
        memberId: member.id,
        memberCode: member.memberCode,
        memberName: member.fullName,
        branchId: currentBranchId,
        timestamp,
        result: 'ALLOWED',
        reason: `CHECK_IN: Validated ${memberShift?.name}. Seat ${seat?.label || 'Floating'}. Gate Open.`,
        gateId,
        shiftId: memberShift?.id,
      };
      setAccessLogs(prev => [log, ...prev]);

      return {
        allowed: true,
        action: 'CHECK_IN',
        reason: `Welcome ${member.fullName}! Seat: ${seat?.label || 'Floating'}. Gate Opened.`,
        member,
        membership,
        shift: memberShift,
        seat,
      };
    }
  };

  const manualCheckInOut = (memberId: string): GateScanResult => {
    const member = members.find(m => m.id === memberId);
    if (!member) return { allowed: false, action: 'DENIED' as const, reason: 'Member not found' };
    return scanGateQR(member.qrToken, 'DESK-MANUAL-OVERRIDE');
  };

  // 8. Operational Expenses
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expense,
      id: 'exp_' + Date.now().toString(36),
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // 9. Shift Config
  const addShift = (shiftData: Omit<Shift, 'id' | 'order'>) => {
    const newShift: Shift = {
      ...shiftData,
      id: 'sh_' + Date.now().toString(36),
      order: shifts.length + 1,
    };
    setShifts(prev => [...prev, newShift]);
  };

  const updateShift = (shiftId: string, updates: Partial<Shift>) => {
    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, ...updates } : s));
  };

  // 10. Branch Transfer
  const transferBranch = (memberId: string, newBranchId: string) => {
    if (newBranchId === currentBranchId) return { success: false, error: 'Target branch is same as current.' };
    
    setAssignments(prev => prev.map(a => a.memberId === memberId && a.status === 'ACTIVE' ? { ...a, status: 'TRANSFERRED' } : a));
    
    setMembers(prev => prev.map(m => m.id === memberId ? {
      ...m,
      branchId: newBranchId,
      qrToken: generateMemberQRToken(m.memberCode, m.id, newBranchId),
    } : m));

    setMemberships(prev => prev.map(m => m.memberId === memberId ? { ...m, branchId: newBranchId } : m));

    return { success: true };
  };

  // 11. WhatsApp Notification Dispatcher
  const sendWhatsAppNotification = (
    memberId: string,
    type: 'EXPIRY_REMINDER_7D' | 'EXPIRY_REMINDER_3D' | 'EXPIRY_TODAY' | 'OVERDUE_ALERT' | 'SEAT_ASSIGNED' | 'PAYMENT_RECEIPT'
  ) => {
    const member = members.find(m => m.id === memberId);
    const membership = memberships.find(m => m.memberId === memberId);
    const shift = shifts.find(s => s.id === membership?.shiftId);
    const assignment = assignments.find(a => a.memberId === memberId && a.status === 'ACTIVE');
    const seat = seats.find(s => s.id === assignment?.seatId);
    const plan = plans.find(p => p.id === membership?.planId);

    const message = generateWhatsAppMessage(type, {
      recipientName: member?.fullName || 'Student',
      phone: member?.phone || '',
      branchName: currentBranch.name,
      seatLabel: seat?.label,
      shiftName: shift?.name,
      expiryDate: membership?.endDate,
      daysRemaining: membership ? getDaysRemaining(membership.endDate) : 0,
      dueAmount: membership?.dueAmount || 0,
      planName: plan?.name,
    });

    const url = buildWhatsAppLink(member?.phone || '', message);

    const log: NotificationLog = {
      id: 'notif_' + Date.now().toString(36),
      memberId: memberId,
      memberName: member?.fullName || 'Member',
      phone: member?.phone || '',
      type,
      channel: 'WHATSAPP',
      message,
      sentAt: `${getTodayString()} ${getCurrentTimeString()}`,
      status: 'SENT',
    };

    setNotifications(prev => [log, ...prev]);
    return { url, log };
  };

  // 12. Backup, Restore & Reset
  const resetToDemoData = () => {
    localStorage.clear();
    setBranches(INITIAL_BRANCHES);
    setShifts(INITIAL_SHIFTS);
    setPlans(INITIAL_PLANS);
    setSeats(INITIAL_SEATS);
    setMembers(INITIAL_MEMBERS);
    setMemberships(INITIAL_MEMBERSHIPS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setPayments(INITIAL_PAYMENTS);
    setAttendance(INITIAL_ATTENDANCE);
    setAccessLogs(INITIAL_ACCESS_LOGS);
    setExpenses(INITIAL_EXPENSES);
    setWaitlist(INITIAL_WAITLIST);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const exportDataJSON = () => {
    const dump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      org,
      branches,
      shifts,
      plans,
      seats,
      members,
      memberships,
      assignments,
      payments,
      attendance,
      accessLogs,
      expenses,
      waitlist,
      notifications,
    };
    return JSON.stringify(dump, null, 2);
  };

  const importDataJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.members && data.seats && data.shifts) {
        setBranches(data.branches || INITIAL_BRANCHES);
        setShifts(data.shifts || INITIAL_SHIFTS);
        setPlans(data.plans || INITIAL_PLANS);
        setSeats(data.seats || INITIAL_SEATS);
        setMembers(data.members || []);
        setMemberships(data.memberships || []);
        setAssignments(data.assignments || []);
        setPayments(data.payments || []);
        setAttendance(data.attendance || []);
        setAccessLogs(data.accessLogs || []);
        setExpenses(data.expenses || []);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        org,
        branches,
        currentBranchId,
        setCurrentBranchId,
        currentBranch,
        shifts,
        plans,
        seats,
        members,
        memberships,
        assignments,
        payments,
        attendance,
        accessLogs,
        expenses,
        waitlist,
        notifications,
        activeRole,
        setActiveRole,
        simulatedClockTime,
        setSimulatedClockTime,
        selectedShiftFilter,
        setSelectedShiftFilter,
        selectedDateFilter,
        setSelectedDateFilter,
        insideAttendanceCount,
        branchOccupancyRate,
        isCloudConnected,
        isSyncingCloud,
        cloudSyncStatusText,
        syncToCloud,
        syncFromCloud,
        refreshCloudStatus,
        addMember,
        updateMember,
        assignSeat,
        transferSeat,
        blockSeat,
        unblockSeat,
        renewMembership,
        recordPayment,
        scanGateQR,
        manualCheckInOut,
        addExpense,
        deleteExpense,
        addShift,
        updateShift,
        transferBranch,
        sendWhatsAppNotification,
        resetToDemoData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
};
