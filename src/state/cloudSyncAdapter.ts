import { getSupabaseClient } from '../lib/supabaseClient';
import {
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
} from '../types';

export interface FullDataset {
  branches: Branch[];
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
}

// 1. Push all local records to Supabase Cloud
export async function pushDatasetToCloud(dataset: FullDataset): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client is not connected. Configure credentials in Settings.' };
  }

  try {
    // 1. Branches
    const branchesPayload = dataset.branches.map(b => ({
      id: b.id,
      org_id: b.orgId,
      name: b.name,
      code: b.code,
      address: b.address,
      phone: b.phone,
      contact_person: b.contactPerson,
      capacity: b.capacity,
      active: b.active,
    }));
    await client.from('branches').upsert(branchesPayload);

    // 2. Shifts
    const shiftsPayload = dataset.shifts.map(s => ({
      id: s.id,
      branch_id: s.branchId,
      name: s.name,
      start_time: s.startTime + ':00',
      end_time: s.endTime + ':00',
      default_price: s.defaultPrice,
      color: s.color,
      active: s.active,
      shift_order: s.order,
    }));
    await client.from('shifts').upsert(shiftsPayload);

    // 3. Plans
    const plansPayload = dataset.plans.map(p => ({
      id: p.id,
      name: p.name,
      duration_days: p.durationDays,
      base_price: p.basePrice,
      description: p.description,
      features: p.features,
    }));
    await client.from('membership_plans').upsert(plansPayload);

    // 4. Seats
    const seatsPayload = dataset.seats.map(s => ({
      id: s.id,
      branch_id: s.branchId,
      label: s.label,
      row_num: s.row,
      col_num: s.col,
      zone: s.zone,
      type: s.type,
      status: s.status,
      is_blocked: s.isBlocked || false,
      block_reason: s.blockReason || null,
      power_socket: s.powerSocket,
      has_locker: s.hasLocker,
    }));
    await client.from('seats').upsert(seatsPayload);

    // 5. Members
    const membersPayload = dataset.members.map(m => ({
      id: m.id,
      member_code: m.memberCode,
      branch_id: m.branchId,
      full_name: m.fullName,
      phone: m.phone,
      email: m.email,
      emergency_contact: m.emergencyContact,
      target_exam: m.targetExam || 'General Study',
      joined_date: m.joinedDate,
      status: m.status,
      qr_token: m.qrToken,
    }));
    await client.from('members').upsert(membersPayload);

    // 6. Memberships
    const membershipsPayload = dataset.memberships.map(msh => ({
      id: msh.id,
      member_id: msh.memberId,
      plan_id: msh.planId,
      branch_id: msh.branchId,
      shift_id: msh.shiftId,
      start_date: msh.startDate,
      end_date: msh.endDate,
      status: msh.status,
      total_fee: msh.totalFee,
      paid_amount: msh.paidAmount,
      due_amount: msh.dueAmount,
      payment_status: msh.paymentStatus,
      auto_renew: msh.autoRenew,
    }));
    await client.from('memberships').upsert(membershipsPayload);

    // 7. Seat Assignments
    const assignmentsPayload = dataset.assignments.map(a => ({
      id: a.id,
      member_id: a.memberId,
      seat_id: a.seatId,
      shift_id: a.shiftId,
      start_date: a.startDate,
      end_date: a.endDate,
      status: a.status,
      assigned_at: a.assignedAt,
    }));
    await client.from('seat_assignments').upsert(assignmentsPayload);

    // 8. Payments
    const paymentsPayload = dataset.payments.map(p => ({
      id: p.id,
      receipt_no: p.receiptNo,
      member_id: p.memberId,
      membership_id: p.membershipId,
      amount: p.amount,
      payment_date: p.paymentDate,
      method: p.method,
      status: p.status,
      recorded_by: p.recordedBy,
      reference_txn_id: p.referenceTxnId || null,
      notes: p.notes || null,
    }));
    await client.from('payments').upsert(paymentsPayload);

    // 9. Attendance
    const attendancePayload = dataset.attendance.map(a => ({
      id: a.id,
      member_id: a.memberId,
      branch_id: a.branchId,
      date: a.date,
      check_in_time: a.checkInTime,
      check_out_time: a.checkOutTime || null,
      duration_minutes: a.durationMinutes || null,
      gate_id: a.gateId,
      status: a.status,
    }));
    await client.from('attendance_records').upsert(attendancePayload);

    // 10. Expenses
    const expensesPayload = dataset.expenses.map(e => ({
      id: e.id,
      branch_id: e.branchId,
      category: e.category,
      title: e.title,
      amount: e.amount,
      date: e.date,
      payment_method: e.paymentMethod,
      recorded_by: e.recordedBy,
      receipt_ref: e.receiptRef || null,
    }));
    await client.from('expenses').upsert(expensesPayload);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 2. Pull all cloud records from Supabase into App State
export async function pullDatasetFromCloud(): Promise<{ success: boolean; data?: Partial<FullDataset>; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client is not connected.' };
  }

  try {
    const [
      { data: branches },
      { data: shifts },
      { data: plans },
      { data: seats },
      { data: members },
      { data: memberships },
      { data: assignments },
      { data: payments },
      { data: attendance },
      { data: expenses },
    ] = await Promise.all([
      client.from('branches').select('*'),
      client.from('shifts').select('*').order('shift_order', { ascending: true }),
      client.from('membership_plans').select('*'),
      client.from('seats').select('*'),
      client.from('members').select('*'),
      client.from('memberships').select('*'),
      client.from('seat_assignments').select('*'),
      client.from('payments').select('*').order('created_at', { ascending: false }),
      client.from('attendance_records').select('*').order('created_at', { ascending: false }),
      client.from('expenses').select('*').order('created_at', { ascending: false }),
    ]);

    const mappedDataset: Partial<FullDataset> = {};

    if (branches && branches.length > 0) {
      mappedDataset.branches = branches.map((b: Record<string, unknown>) => ({
        id: String(b.id),
        orgId: String(b.org_id || 'org_1'),
        name: String(b.name),
        code: String(b.code),
        address: String(b.address || ''),
        phone: String(b.phone || ''),
        contactPerson: String(b.contact_person || ''),
        capacity: Number(b.capacity || 36),
        active: Boolean(b.active),
      }));
    }

    if (shifts && shifts.length > 0) {
      mappedDataset.shifts = shifts.map((s: Record<string, unknown>) => ({
        id: String(s.id),
        branchId: String(s.branch_id),
        name: String(s.name),
        startTime: String(s.start_time).substring(0, 5),
        endTime: String(s.end_time).substring(0, 5),
        defaultPrice: Number(s.default_price),
        color: String(s.color || '#3b82f6'),
        active: Boolean(s.active),
        order: Number(s.shift_order || 1),
      }));
    }

    if (seats && seats.length > 0) {
      mappedDataset.seats = seats.map((s: Record<string, unknown>) => ({
        id: String(s.id),
        branchId: String(s.branch_id),
        label: String(s.label),
        row: Number(s.row_num || 1),
        col: Number(s.col_num || 1),
        zone: s.zone as Seat['zone'],
        type: s.type as Seat['type'],
        status: s.status as Seat['status'],
        isBlocked: Boolean(s.is_blocked),
        blockReason: s.block_reason ? String(s.block_reason) : undefined,
        powerSocket: Boolean(s.power_socket),
        hasLocker: Boolean(s.has_locker),
      }));
    }

    if (members && members.length > 0) {
      mappedDataset.members = members.map((m: Record<string, unknown>) => ({
        id: String(m.id),
        memberCode: String(m.member_code),
        branchId: String(m.branch_id),
        fullName: String(m.full_name),
        phone: String(m.phone),
        email: String(m.email || ''),
        emergencyContact: String(m.emergency_contact || ''),
        targetExam: String(m.target_exam || 'General Study'),
        joinedDate: String(m.joined_date || ''),
        status: m.status as Member['status'],
        qrToken: String(m.qr_token),
      }));
    }

    if (memberships && memberships.length > 0) {
      mappedDataset.memberships = memberships.map((msh: Record<string, unknown>) => ({
        id: String(msh.id),
        memberId: String(msh.member_id),
        planId: String(msh.plan_id),
        branchId: String(msh.branch_id),
        shiftId: String(msh.shift_id),
        startDate: String(msh.start_date),
        endDate: String(msh.end_date),
        status: msh.status as Membership['status'],
        totalFee: Number(msh.total_fee),
        paidAmount: Number(msh.paid_amount || 0),
        dueAmount: Number(msh.due_amount || 0),
        paymentStatus: msh.payment_status as Membership['paymentStatus'],
        autoRenew: Boolean(msh.auto_renew),
      }));
    }

    if (assignments && assignments.length > 0) {
      mappedDataset.assignments = assignments.map((a: Record<string, unknown>) => ({
        id: String(a.id),
        memberId: String(a.member_id),
        seatId: String(a.seat_id),
        shiftId: String(a.shift_id),
        startDate: String(a.start_date),
        endDate: String(a.end_date),
        status: a.status as SeatAssignment['status'],
        assignedAt: String(a.assigned_at),
      }));
    }

    if (payments && payments.length > 0) {
      mappedDataset.payments = payments.map((p: Record<string, unknown>) => ({
        id: String(p.id),
        receiptNo: String(p.receipt_no),
        memberId: String(p.member_id),
        membershipId: String(p.membership_id),
        amount: Number(p.amount),
        paymentDate: String(p.payment_date),
        method: p.method as Payment['method'],
        status: (p.status as Payment['status']) || 'PAID',
        recordedBy: String(p.recorded_by || 'Reception Desk'),
        referenceTxnId: p.reference_txn_id ? String(p.reference_txn_id) : undefined,
        notes: p.notes ? String(p.notes) : undefined,
      }));
    }

    if (attendance && attendance.length > 0) {
      mappedDataset.attendance = attendance.map((a: Record<string, unknown>) => ({
        id: String(a.id),
        memberId: String(a.member_id),
        branchId: String(a.branch_id),
        gateId: String(a.gate_id || 'GATE-01'),
        date: String(a.date),
        checkInTime: String(a.check_in_time),
        checkOutTime: a.check_out_time ? String(a.check_out_time) : undefined,
        durationMinutes: a.duration_minutes ? Number(a.duration_minutes) : undefined,
        status: a.status as AttendanceRecord['status'],
      }));
    }

    return { success: true, data: mappedDataset };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
