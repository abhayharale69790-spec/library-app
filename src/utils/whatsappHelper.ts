// WhatsApp Direct Integration & Notification Template Generator
// Dynamically uses owner's configured business identity (No hardcoded "24Library Team")

export interface WhatsAppNotificationPayload {
  businessName?: string;
  recipientName: string;
  phone: string;
  branchName: string;
  seatLabel?: string;
  shiftName?: string;
  expiryDate?: string;
  daysRemaining?: number;
  dueAmount?: number;
  receiptNo?: string;
  amountPaid?: number;
  planName?: string;
  supportPhone?: string;
}

export function generateWhatsAppMessage(
  type: 'EXPIRY_REMINDER_7D' | 'EXPIRY_REMINDER_3D' | 'EXPIRY_TODAY' | 'OVERDUE_ALERT' | 'SEAT_ASSIGNED' | 'PAYMENT_RECEIPT',
  data: WhatsAppNotificationPayload
): string {
  const brand = data.businessName || data.branchName || 'Study Center';
  const signoff = `— *${brand} Management*`;

  switch (type) {
    case 'EXPIRY_REMINDER_7D':
      return `📚 *${brand} — Membership Reminder*\n\nDear *${data.recipientName}*,\nThis is a friendly reminder that your study seat (*${data.seatLabel || 'Assigned Seat'}* | *${data.shiftName || 'Regular Shift'}*) at *${data.branchName}* will expire in *7 days* on *${data.expiryDate}*.\n\nTo retain your favorite seat without disruption, please renew your membership at the front desk or online portal.\n\nHave a productive study session!\n${signoff}`;

    case 'EXPIRY_REMINDER_3D':
      return `⚠️ *URGENT: ${brand} Seat Expiry in 3 Days*\n\nDear *${data.recipientName}*,\nYour membership at *${data.branchName}* expires on *${data.expiryDate}* (3 days remaining).\n\n*Seat:* ${data.seatLabel || 'Reserved'}\n*Shift:* ${data.shiftName}\n\n*Note:* Seats with pending renewal after expiry date may be released for waitlisted candidates.\n\nRenew today to secure your seat reservation.\n${signoff}`;

    case 'EXPIRY_TODAY':
      return `🚨 *${brand} — Membership Expiring TODAY*\n\nDear *${data.recipientName}*,\nYour membership at *${data.branchName}* expires *TODAY (${data.expiryDate})*.\n\nYour QR gate access will be deactivated tomorrow morning. Kindly renew immediately to maintain uninterrupted access and retain Seat *${data.seatLabel}*.\n\n${signoff}`;

    case 'OVERDUE_ALERT':
      return `🔔 *${brand} — Outstanding Fee Notice*\n\nDear *${data.recipientName}*,\nYou have an outstanding membership balance of *₹${data.dueAmount?.toLocaleString('en-IN')}* at *${data.branchName}*.\n\nKindly clear the dues at your earliest convenience to avoid access interruptions.\n\n${signoff}`;

    case 'SEAT_ASSIGNED':
      return `🎉 *Welcome to ${brand}!*\n\nDear *${data.recipientName}*,\nYour seat reservation is confirmed:\n\n📍 *Center:* ${data.branchName}\n🪑 *Seat:* ${data.seatLabel}\n⏰ *Shift:* ${data.shiftName}\n📅 *Valid Till:* ${data.expiryDate}\n\nYour digital QR access card is now active. See you soon!\n${signoff}`;

    case 'PAYMENT_RECEIPT':
      return `🧾 *${brand} — Fee Payment Receipt*\n\nDear *${data.recipientName}*,\nWe have successfully received your payment of *₹${data.amountPaid?.toLocaleString('en-IN')}*.\n\n*Receipt No:* ${data.receiptNo}\n*Plan:* ${data.planName || 'Study Pass'}\n*Remaining Due:* ₹${data.dueAmount || 0}\n\nThank you for choosing ${brand}!\n${signoff}`;
  }
}

export function buildWhatsAppLink(phone: string, message: string): string {
  // Strip non-digits
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  // Default to India country code 91 if 10 digits
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
