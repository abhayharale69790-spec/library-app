import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BusinessProfile,
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
  SeatNamingStyle,
  SetupWizardData,
} from '../types';
import {
  INITIAL_BUSINESS_PROFILE,
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
  businessProfile: BusinessProfile;
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

  // Business & Setup Actions
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  completeSetupWizard: (data: SetupWizardData) => void;
  bulkGenerateSeats: (branchId: string, count: number, style: SeatNamingStyle, customPrefix?: string) => void;

  // Core Actions
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
  deleteShift: (shiftId: string) => void;

  addBranch: (branchData: Omit<Branch, 'id' | 'orgId' | 'active'>) => Branch;
  updateBranch: (branchId: string, branchData: Partial<Branch>) => void;
  deleteBranch: (branchId: string) => void;

  addMembershipPlan: (plan: Omit<MembershipPlan, 'id'>) => void;
  updateMembershipPlan: (planId: string, plan: Partial<MembershipPlan>) => void;
  deleteMembershipPlan: (planId: string) => void;

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
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_businessProfile');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_PROFILE;
  });

  const [org] = useState<Organization>(INITIAL_ORG);
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_branches');
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });
  const [currentBranchId, setCurrentBranchId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_currentBranchId');
    return saved || (INITIAL_BRANCHES[0]?.id || 'br_1');
  });

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
  const [cloudSyncStatusText, setCloudSyncStatusText] = useState<string>('Local Storage Standalone');

  // App active role & simulation time
  const [activeRole, setActiveRole] = useState<Role>('ADMIN');
  const [simulatedClockTime, setSimulatedClockTime] = useState<string>(() => getCurrentTimeString());
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>(() => shifts[0]?.id || 'sh_1');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(() => getTodayString());

  // Auto-sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_businessProfile', JSON.stringify(businessProfile));
    localStorage.setItem(STORAGE_KEY + '_branches', JSON.stringify(branches));
    localStorage.setItem(STORAGE_KEY + '_currentBranchId', currentBranchId);
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
  }, [businessProfile, branches, currentBranchId, shifts, plans, seats, members, memberships, assignments, payments, attendance, accessLogs, expenses, waitlist, notifications]);

  // Current active branch object
  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0] || INITIAL_BRANCHES[0];

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

  const syncToCloud = async (): Promise<{ success: boolean; error?: string }> => {
    setIsSyncingCloud(true);
    setCloudSyncStatusText('Uploading local state to Cloud PostgreSQL...');
    try {
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
        setCloudSyncStatusText('✓ Cloud Database in Sync');
        return { success: true };
      } else {
        setCloudSyncStatusText(`Sync Failed: ${res.error}`);
        return { success: false, error: res.error };
      }
    } catch (e: any) {
      setIsSyncingCloud(false);
      setCloudSyncStatusText(`Sync Error: ${e.message}`);
      return { success: false, error: e.message };
    }
  };

  const syncFromCloud = async (): Promise<{ success: boolean; error?: string }> => {
    setIsSyncingCloud(true);
    setCloudSyncStatusText('Pulling latest dataset from Cloud PostgreSQL...');
    try {
      const res = await pullDatasetFromCloud();
      setIsSyncingCloud(false);
      if (res.success && res.data) {
        const d = res.data;
        if (d.branches) setBranches(d.branches);
        if (d.shifts) setShifts(d.shifts);
        if (d.plans) setPlans(d.plans);
        if (d.seats) setSeats(d.seats);
        if (d.members) setMembers(d.members);
        if (d.memberships) setMemberships(d.memberships);
        if (d.assignments) setAssignments(d.assignments);
        if (d.payments) setPayments(d.payments);
        if (d.attendance) setAttendance(d.attendance);
        if (d.accessLogs) setAccessLogs(d.accessLogs);
        if (d.expenses) setExpenses(d.expenses);

        setCloudSyncStatusText('✓ Local state updated from Cloud');
        return { success: true };
      } else {
        setCloudSyncStatusText(`Pull Failed: ${res.error}`);
        return { success: false, error: res.error };
      }
    } catch (e: any) {
      setIsSyncingCloud(false);
      setCloudSyncStatusText(`Pull Error: ${e.message}`);
      return { success: false, error: e.message };
    }
  };

  // --- BUSINESS IDENTITY & SETUP WIZARD ---
  const updateBusinessProfile = (profileUpdates: Partial<BusinessProfile>) => {
    setBusinessProfile(prev => ({
      ...prev,
      ...profileUpdates,
    }));
  };

  const bulkGenerateSeats = (branchId: string, count: number, style: SeatNamingStyle, customPrefix?: string) => {
    const generated: Seat[] = [];
    const prefix = style === 'CUSTOM' ? (customPrefix || 'D-') : style === 'ALPHA_NUMERIC' ? 'A-' : '';

    for (let i = 1; i <= count; i++) {
      const padNum = i < 10 ? `0${i}` : `${i}`;
      let label = `${prefix}${padNum}`;
      if (style === 'ALPHA_NUMERIC' && i > 30) {
        const rowLetter = String.fromCharCode(65 + Math.floor((i - 1) / 30));
        const seatInRow = ((i - 1) % 30) + 1;
        const seatPad = seatInRow < 10 ? `0${seatInRow}` : `${seatInRow}`;
        label = `${rowLetter}-${seatPad}`;
      }

      generated.push({
        id: `seat_${branchId}_${i}`,
        branchId,
        label,
        row: Math.floor((i - 1) / 6) + 1,
        col: ((i - 1) % 6) + 1,
        zone: 'Standard',
        type: 'FIXED',
        status: 'ACTIVE',
        powerSocket: true,
        hasLocker: i % 2 === 0,
      });
    }

    setSeats(prev => {
      const otherBranchSeats = prev.filter(s => s.branchId !== branchId);
      return [...otherBranchSeats, ...generated];
    });
  };

  const completeSetupWizard = (data: SetupWizardData) => {
    const newProfile: BusinessProfile = {
      ...businessProfile,
      name: data.businessName,
      type: data.businessType,
      shortName: data.shortName || data.businessName.slice(0, 4).toUpperCase(),
      logoUrl: data.logoUrl,
      phone: data.phone,
      whatsapp: data.whatsapp || data.phone,
      address: data.address,
      receiptPrefix: (data.shortName || 'RCP') + '-',
      isConfigured: true,
    };
    setBusinessProfile(newProfile);

    // Create/Update main branch
    const branchId = 'br_1';
    const newBranch: Branch = {
      id: branchId,
      orgId: 'org_1',
      name: data.branchName || `${data.businessName} - Main Center`,
      code: (data.shortName || 'BR') + '-01',
      address: data.address,
      phone: data.phone,
      contactPerson: 'Manager',
      capacity: data.totalSeats,
      active: true,
    };
    setBranches([newBranch]);
    setCurrentBranchId(branchId);

    // Bulk generate seats
    bulkGenerateSeats(branchId, data.totalSeats, data.seatNamingStyle, data.customPrefix);

    // Create shifts
    if (data.shifts && data.shifts.length > 0) {
      const newShifts: Shift[] = data.shifts.map((s, idx) => ({
        id: `sh_${idx + 1}`,
        branchId: branchId,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        defaultPrice: s.defaultPrice,
        color: idx === 0 ? 'var(--shift-morning)' : idx === 1 ? 'var(--shift-evening)' : 'var(--shift-fullday)',
        active: true,
        order: idx + 1,
      }));
      setShifts(newShifts);
      setSelectedShiftFilter(newShifts[0].id);
    }

    // Create plans
    if (data.plans && data.plans.length > 0) {
      const newPlans: MembershipPlan[] = data.plans.map((p, idx) => ({
        id: `plan_${idx + 1}`,
        name: p.name,
        durationDays: p.durationDays,
        basePrice: p.basePrice,
        description: `${p.name} access pass`,
        features: ['High-speed Wi-Fi', 'Air Conditioning', 'Power Socket Desk', 'Digital Pass'],
      }));
      setPlans(newPlans);
    }
  };

  // Branch Management
  const addBranch = (branchData: Omit<Branch, 'id' | 'orgId' | 'active'>): Branch => {
    const newId = `br_${Date.now().toString(36)}`;
    const newBranch: Branch = {
      ...branchData,
      id: newId,
      orgId: 'org_1',
      active: true,
    };
    setBranches(prev => [...prev, newBranch]);
    bulkGenerateSeats(newId, branchData.capacity || 50, 'ALPHA_NUMERIC');
    return newBranch;
  };

  const updateBranch = (branchId: string, branchData: Partial<Branch>) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, ...branchData } : b));
  };

  const deleteBranch = (branchId: string) => {
    if (branches.length <= 1) return;
    setBranches(prev => prev.filter(b => b.id !== branchId));
    if (currentBranchId === branchId) {
      const remaining = branches.filter(b => b.id !== branchId);
      setCurrentBranchId(remaining[0]?.id || 'br_1');
    }
  };

  // Plan Management
  const addMembershipPlan = (planData: Omit<MembershipPlan, 'id'>) => {
    const newId = `plan_${Date.now().toString(36)}`;
    const newPlan: MembershipPlan = {
      ...planData,
      id: newId,
    };
    setPlans(prev => [...prev, newPlan]);
  };

  const updateMembershipPlan = (planId: string, updates: Partial<MembershipPlan>) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
  };

  const deleteMembershipPlan = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
  };

  // 1. Add Student (Member + Membership + Seat Assignment + Payment)
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
    const normalizedPhone = data.phone.replace(/[^0-9]/g, '').slice(-10);
    const existing = members.find(m => m.phone.replace(/[^0-9]/g, '').slice(-10) === normalizedPhone);
    if (existing) {
      return { success: false, error: `Student with phone ${data.phone} already registered (${existing.fullName}, ${existing.memberCode}).` };
    }

    const selectedPlan = plans.find(p => p.id === data.planId) || plans[0];
    const today = getTodayString();
    const endDate = addDays(today, selectedPlan.durationDays);

    // Seat availability check if specified
    if (data.seatId) {
      const targetSeat = seats.find(s => s.id === data.seatId);
      if (targetSeat?.isBlocked) {
        return { success: false, error: 'Selected seat is under maintenance.' };
      }
      const isOccupied = assignments.some(
        a => a.seatId === data.seatId && 
             a.shiftId === data.shiftId && 
             a.status === 'ACTIVE' &&
             doDateRangesOverlap(today, endDate, a.startDate, a.endDate)
      );
      if (isOccupied) {
        return { success: false, error: 'Selected seat is already occupied in this shift.' };
      }
    }

    const prefix = businessProfile.shortName || 'MEM';
    const memberId = 'mem_' + Date.now().toString(36);
    const memberCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = generateMemberQRToken(memberCode, memberId, currentBranchId);

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

    const totalFee = selectedPlan.basePrice;
    const paid = Number(data.amountPaid);
    const due = Math.max(0, totalFee - paid);
    const paymentStatus = due === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'OVERDUE';

    const membershipId = 'msh_' + Date.now().toString(36);
    const newMembership: Membership = {
      id: membershipId,
      memberId,
      branchId: currentBranchId,
      planId: data.planId,
      shiftId: data.shiftId,
      startDate: today,
      endDate,
      totalFee,
      paidAmount: paid,
      dueAmount: due,
      status: 'ACTIVE',
      paymentStatus,
      autoRenew: true,
      assignedSeatId: data.seatId,
      createdAt: today,
    };

    const newAssignments: SeatAssignment[] = [];
    if (data.seatId) {
      newAssignments.push({
        id: 'asg_' + Date.now().toString(36),
        seatId: data.seatId,
        memberId,
        shiftId: data.shiftId,
        startDate: today,
        endDate,
        status: 'ACTIVE',
        assignedAt: today,
      });
    }

    const newPayments: Payment[] = [];
    if (paid > 0) {
      newPayments.push({
        id: 'pay_' + Date.now().toString(36),
        receiptNo: `${businessProfile.receiptPrefix || 'RCP-'}${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId,
        membershipId,
        amount: paid,
        paymentDate: today,
        method: data.paymentMethod,
        status: due === 0 ? 'PAID' : 'PARTIAL',
        notes: `Admission fee for ${selectedPlan.name}`,
        recordedBy: 'Reception Staff',
      });
    }

    setMembers(prev => [newMember, ...prev]);
    setMemberships(prev => [newMembership, ...prev]);
    if (newAssignments.length > 0) setAssignments(prev => [...newAssignments, ...prev]);
    if (newPayments.length > 0) setPayments(prev => [...newPayments, ...prev]);

    return { success: true, member: newMember };
  };

  const updateMember = (memberId: string, data: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...data } : m));
  };

  // 2. Assign Seat
  const assignSeat = (
    memberId: string,
    seatId: string,
    shiftId: string,
    startDate: string,
    endDate: string
  ) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return { success: false, error: 'Seat not found.' };
    if (seat.isBlocked) return { success: false, error: `Seat ${seat.label} is currently blocked for maintenance.` };

    const conflict = assignments.find(
      a => a.seatId === seatId &&
           a.shiftId === shiftId &&
           a.status === 'ACTIVE' &&
           doDateRangesOverlap(startDate, endDate, a.startDate, a.endDate)
    );

    if (conflict) {
      const occupant = members.find(m => m.id === conflict.memberId);
      return {
        success: false,
        error: `Desk ${seat.label} is already reserved by ${occupant?.fullName || 'another student'} (${conflict.startDate} to ${conflict.endDate}).`
      };
    }

    setAssignments(prev => prev.map(a => 
      a.memberId === memberId && a.shiftId === shiftId && a.status === 'ACTIVE' 
        ? { ...a, status: 'TRANSFERRED' } 
        : a
    ));

    const newAssignment: SeatAssignment = {
      id: 'asg_' + Date.now().toString(36),
      seatId,
      memberId,
      shiftId,
      startDate,
      endDate,
      status: 'ACTIVE',
      assignedAt: getTodayString(),
    };

    setAssignments(prev => [newAssignment, ...prev]);
    setMemberships(prev => prev.map(m => m.memberId === memberId && m.status === 'ACTIVE' ? { ...m, assignedSeatId: seatId } : m));

    return { success: true };
  };

  // 3. Transfer Seat
  const transferSeat = (memberId: string, targetSeatId: string, shiftId: string) => {
    const today = getTodayString();
    const activeMembership = memberships.find(m => m.memberId === memberId && m.status !== 'CANCELLED');
    const endDate = activeMembership?.endDate || addDays(today, 30);
    return assignSeat(memberId, targetSeatId, shiftId, today, endDate);
  };

  // 4. Block / Unblock Seat
  const blockSeat = (seatId: string, reason: string) => {
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, isBlocked: true, blockReason: reason, status: 'MAINTENANCE' } : s));
    return { success: true };
  };

  const unblockSeat = (seatId: string) => {
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, isBlocked: false, blockReason: undefined, status: 'ACTIVE' } : s));
    return { success: true };
  };

  // 5. Renew Membership
  const renewMembership = (
    memberId: string,
    planId: string,
    shiftId: string,
    amountPaid: number,
    paymentMethod: Payment['method']
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return { success: false, error: 'Student not found.' };

    const plan = plans.find(p => p.id === planId) || plans[0];
    const currentMsh = memberships.find(m => m.memberId === memberId && m.status !== 'CANCELLED');
    const today = getTodayString();

    const { startDate: newStartDate, endDate: newEndDate } = calculateRenewalDates(
      currentMsh?.endDate || today,
      plan.durationDays
    );

    const totalFee = plan.basePrice;
    const paid = Number(amountPaid);
    const due = Math.max(0, totalFee - paid);
    const paymentStatus = due === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'OVERDUE';

    const newMshId = 'msh_' + Date.now().toString(36);
    const newMembership: Membership = {
      id: newMshId,
      memberId,
      branchId: currentBranchId,
      planId,
      shiftId,
      startDate: newStartDate,
      endDate: newEndDate,
      totalFee,
      paidAmount: paid,
      dueAmount: due,
      status: 'ACTIVE',
      paymentStatus,
      autoRenew: true,
      assignedSeatId: currentMsh?.assignedSeatId,
      createdAt: today,
    };

    if (currentMsh) {
      setMemberships(prev => prev.map(m => m.id === currentMsh.id ? { ...m, status: 'EXPIRED' } : m));
    }
    setMemberships(prev => [newMembership, ...prev]);

    if (currentMsh?.assignedSeatId) {
      const activeAsg = assignments.find(a => a.memberId === memberId && a.seatId === currentMsh.assignedSeatId && a.status === 'ACTIVE');
      if (activeAsg) {
        setAssignments(prev => prev.map(a => a.id === activeAsg.id ? { ...a, endDate: newEndDate } : a));
      } else {
        setAssignments(prev => [{
          id: 'asg_' + Date.now().toString(36),
          seatId: currentMsh.assignedSeatId!,
          memberId,
          shiftId,
          startDate: newStartDate,
          endDate: newEndDate,
          status: 'ACTIVE',
          assignedAt: today,
        }, ...prev]);
      }
    }

    if (paid > 0) {
      const receipt: Payment = {
        id: 'pay_' + Date.now().toString(36),
        receiptNo: `${businessProfile.receiptPrefix || 'RCP-'}${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId,
        membershipId: newMshId,
        amount: paid,
        paymentDate: today,
        method: paymentMethod,
        status: due === 0 ? 'PAID' : 'PARTIAL',
        notes: `Subscription Renewal for ${plan.name}`,
        recordedBy: 'Reception Desk',
      };
      setPayments(prev => [receipt, ...prev]);
    }

    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'ACTIVE' } : m));
    return { success: true };
  };

  // 6. Record Payment
  const recordPayment = (
    memberId: string,
    amount: number,
    method: Payment['method'],
    reference?: string,
    notes?: string
  ) => {
    if (amount <= 0) return { success: false, error: 'Payment amount must be positive.' };

    const activeMsh = memberships.find(m => m.memberId === memberId && m.status !== 'CANCELLED');
    if (!activeMsh) return { success: false, error: 'Active membership not found.' };

    const today = getTodayString();
    const newPaid = activeMsh.paidAmount + amount;
    const newDue = Math.max(0, activeMsh.totalFee - newPaid);
    const paymentStatus = newDue === 0 ? 'PAID' : 'PARTIAL';

    const receipt: Payment = {
      id: 'pay_' + Date.now().toString(36),
      receiptNo: `${businessProfile.receiptPrefix || 'RCP-'}${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      memberId,
      membershipId: activeMsh.id,
      amount,
      paymentDate: today,
      method,
      status: paymentStatus,
      referenceTxnId: reference,
      notes: notes || 'Fee installment receipt',
      recordedBy: 'Reception Desk',
    };

    setPayments(prev => [receipt, ...prev]);
    setMemberships(prev => prev.map(m => m.id === activeMsh.id ? { ...m, paidAmount: newPaid, dueAmount: newDue, paymentStatus } : m));

    return { success: true, receipt };
  };

  // 7. QR Gate Scanner
  const scanGateQR = (qrPayload: string, gateId: string = 'GATE-01'): GateScanResult => {
    const parseRes = parseQRToken(qrPayload);
    const now = simulatedClockTime || getCurrentTimeString();
    const today = getTodayString();

    if (!parseRes.isValid || !parseRes.memberId) {
      audioSynth.playAccessDenied();
      const log: AccessLog = {
        id: 'acc_' + Date.now().toString(36),
        timestamp: getCurrentTimestampString(),
        branchId: currentBranchId,
        gateId,
        action: 'DENIED',
        result: 'DENIED',
        reason: 'Invalid QR code signature',
      };
      setAccessLogs(prev => [log, ...prev]);
      return { allowed: false, action: 'DENIED', reason: log.reason };
    }

    const member = members.find(m => m.id === parseRes.memberId);
    if (!member) {
      audioSynth.playAccessDenied();
      return { allowed: false, action: 'DENIED', reason: 'Student not found in registry.' };
    }

    if (member.branchId !== currentBranchId) {
      audioSynth.playAccessDenied();
      return { allowed: false, action: 'DENIED', reason: 'Pass belongs to a different center.' };
    }

    const membership = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
    if (!membership) {
      audioSynth.playAccessDenied();
      return { allowed: false, action: 'DENIED', reason: 'No active subscription found.' };
    }

    if (getDaysRemaining(membership.endDate) < 0) {
      audioSynth.playAccessDenied();
      return { allowed: false, action: 'DENIED', reason: `Membership expired on ${membership.endDate}. Please renew.` };
    }

    const shift = shifts.find(s => s.id === membership.shiftId);
    if (shift) {
      const allowedInShift = isTimeInShift(now, shift.startTime, shift.endTime, businessProfile.gracePeriodMinutes || 15);
      if (!allowedInShift) {
        audioSynth.playAccessDenied();
        return {
          allowed: false,
          action: 'DENIED',
          member,
          membership,
          shift,
          reason: `Shift mismatch: Allowed timing is ${shift.startTime} - ${shift.endTime}. (Current: ${now})`,
        };
      }
    }

    const activeSession = attendance.find(a => a.memberId === member.id && a.status === 'INSIDE' && a.date === today);
    const assignment = assignments.find(a => a.memberId === member.id && a.status === 'ACTIVE');
    const seat = assignment ? seats.find(s => s.id === assignment.seatId) : undefined;

    if (!activeSession) {
      // CHECK-IN
      audioSynth.playAccessGranted();
      const newAttendance: AttendanceRecord = {
        id: 'att_' + Date.now().toString(36),
        memberId: member.id,
        branchId: currentBranchId,
        date: today,
        checkInTime: now,
        gateId,
        seatLabel: seat?.label,
        status: 'INSIDE',
      };
      setAttendance(prev => [newAttendance, ...prev]);

      const log: AccessLog = {
        id: 'acc_' + Date.now().toString(36),
        timestamp: getCurrentTimestampString(),
        memberId: member.id,
        memberName: member.fullName,
        memberCode: member.memberCode,
        branchId: currentBranchId,
        gateId,
        action: 'ENTRY',
        result: 'ALLOWED',
        reason: `Access Granted • Assigned Desk: ${seat?.label || 'Floating'}`,
      };
      setAccessLogs(prev => [log, ...prev]);

      return {
        allowed: true,
        action: 'CHECK_IN',
        reason: `Welcome ${member.fullName}! Entry recorded.`,
        member,
        membership,
        shift,
        seat,
      };
    } else {
      // CHECK-OUT
      audioSynth.playAccessGranted();
      const [inH, inM] = activeSession.checkInTime.split(':').map(Number);
      const [outH, outM] = now.split(':').map(Number);
      let duration = (outH * 60 + outM) - (inH * 60 + inM);
      if (duration < 0) duration += 24 * 60;

      setAttendance(prev => prev.map(a => a.id === activeSession.id ? {
        ...a,
        checkOutTime: now,
        durationMinutes: duration,
        status: 'COMPLETED',
      } : a));

      const log: AccessLog = {
        id: 'acc_' + Date.now().toString(36),
        timestamp: getCurrentTimestampString(),
        memberId: member.id,
        memberName: member.fullName,
        memberCode: member.memberCode,
        branchId: currentBranchId,
        gateId,
        action: 'EXIT',
        result: 'ALLOWED',
        reason: `Exit Recorded (${Math.floor(duration/60)}h ${duration%60}m studied)`,
      };
      setAccessLogs(prev => [log, ...prev]);

      return {
        allowed: true,
        action: 'CHECK_OUT',
        reason: `Good work ${member.fullName}! Session: ${Math.floor(duration / 60)}h ${duration % 60}m.`,
        member,
        membership,
        shift,
        seat,
        durationMinutes: duration,
      };
    }
  };

  const manualCheckInOut = (memberId: string): GateScanResult => {
    const member = members.find(m => m.id === memberId);
    if (!member) return { allowed: false, action: 'DENIED', reason: 'Student not found.' };
    return scanGateQR(member.qrToken, 'MANUAL-DESK');
  };

  // 8. Expense Management
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: 'exp_' + Date.now().toString(36),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // 9. Shift Management
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

  const deleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
  };

  // 10. Branch Transfer
  const transferBranch = (memberId: string, newBranchId: string) => {
    if (newBranchId === currentBranchId) return { success: false, error: 'Target center is same as current.' };
    
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
      businessName: businessProfile.name,
      supportPhone: businessProfile.phone,
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
      memberName: member?.fullName || 'Student',
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

  // Reset to Demo Data
  const resetToDemoData = () => {
    setBusinessProfile(INITIAL_BUSINESS_PROFILE);
    setBranches(INITIAL_BRANCHES);
    setCurrentBranchId('br_1');
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
      version: '2.0',
      exportedAt: new Date().toISOString(),
      businessProfile,
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
        if (data.businessProfile) setBusinessProfile(data.businessProfile);
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
        businessProfile,
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
        updateBusinessProfile,
        completeSetupWizard,
        bulkGenerateSeats,
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
        deleteShift,
        addBranch,
        updateBranch,
        deleteBranch,
        addMembershipPlan,
        updateMembershipPlan,
        deleteMembershipPlan,
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
