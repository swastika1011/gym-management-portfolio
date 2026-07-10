"use server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Member from "@/models/member";
import Payment from "@/models/payments";

export type PaymentType = "Admission" | "Monthly";
export type PaymentMode = "Cash" | "UPI";
type SerializedRecord = Record<string, unknown>;

export type ActionResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

export type RecordPaymentInput = {
  memberId: string;
  paymentType: PaymentType;
  amount?: number;
  paymentMode: PaymentMode;
  paymentDate?: Date | string;
  paymentForMonth?: number;
  paymentForYear?: number;
  remarks?: string;
};

export type UpdatePaymentInput = {
  amount?: number;
  paymentMode?: PaymentMode;
  paymentDate?: Date | string;
  paymentForMonth?: number;
  paymentForYear?: number;
  remarks?: string;
};

export type GetPaymentsFilters = {
  month?: number;
  year?: number;
  paymentType?: PaymentType;
  paymentMode?: PaymentMode;
  memberName?: string;
  memberId?: string;
};

export type PaymentData = {
  _id: string;
  memberId: string | SerializedRecord;
  paymentType: PaymentType;
  amount: number;
  paymentForMonth?: number;
  paymentForYear?: number;
  paymentMonth?: number;
  paymentYear?: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

export type PendingPaymentData = {
  member: SerializedRecord;
  pendingMonth: {
    month: number;
    year: number;
  };
  outstandingAmount: number;
  pendingMonths: number;
  lastPaymentDate: string | null;
};

export type PendingFeeQueueItem = {
  member: SerializedRecord;
  feeType: "Admission" | "Monthly" | "Admission + Monthly";
  pendingMonths: number;
  admissionDue: number;
  monthlyDue: number;
  outstandingAmount: number;
  oldestPendingMonth: {
    month: number;
    year: number;
  } | null;
};

export type PendingFeesSummaryData = {
  pendingMembersCount: number;
  totalOutstandingAmount: number;
  items: PendingFeeQueueItem[];
};

export type RevenueData = {
  collectedRevenue: number;
  expectedRevenue: number;
  pendingRevenue: number;
  activeMembers: number;
  paidMembers: number;
  pendingMembers: number;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isPaymentType(paymentType: unknown): paymentType is PaymentType {
  return paymentType === "Admission" || paymentType === "Monthly";
}

function isPaymentMode(paymentMode: unknown): paymentMode is PaymentMode {
  return paymentMode === "Cash" || paymentMode === "UPI";
}

function isValidMonth(month: unknown): month is number {
  return (
    typeof month === "number" &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}

function isValidYear(year: unknown): year is number {
  return (
    typeof year === "number" &&
    Number.isInteger(year) &&
    year >= 1900 &&
    year <= 9999
  );
}

function isValidAmount(amount: unknown): amount is number {
  return typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return value;
}

function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function monthIndex(month: number, year: number) {
  return year * 12 + month - 1;
}

function getPaidForMonth(payment: {
  paymentForMonth?: number;
  paymentMonth?: number;
}) {
  return payment.paymentForMonth ?? payment.paymentMonth;
}

function getPaidForYear(payment: {
  paymentForYear?: number;
  paymentYear?: number;
}) {
  return payment.paymentForYear ?? payment.paymentYear;
}

function getMonthlyDuplicateQuery(
  memberId: mongoose.Types.ObjectId | string,
  month: number,
  year: number
) {
  return {
    memberId,
    paymentType: "Monthly",
    $or: [
      { paymentForMonth: month, paymentForYear: year },
      { paymentMonth: month, paymentYear: year },
    ],
  };
}

function calculatePendingMonths(
  joinDate: Date | string,
  paidMonths: Set<string>,
  targetMonth: number,
  targetYear: number
) {
  const joinedAt = new Date(joinDate);
  const startMonth = joinedAt.getMonth() + 1;
  const startYear = joinedAt.getFullYear();
  const startIndex = monthIndex(startMonth, startYear);
  const targetIndex = monthIndex(targetMonth, targetYear);

  if (targetIndex < startIndex) {
    return 0;
  }

  let pendingMonths = 0;

  for (let index = startIndex; index <= targetIndex; index += 1) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;

    if (!paidMonths.has(`${year}-${month}`)) {
      pendingMonths += 1;
    }
  }

  return pendingMonths;
}

function getOldestPendingMonth(
  joinDate: Date | string,
  paidMonths: Set<string>,
  targetMonth: number,
  targetYear: number
) {
  const joinedAt = new Date(joinDate);
  const startIndex = monthIndex(joinedAt.getMonth() + 1, joinedAt.getFullYear());
  const targetIndex = monthIndex(targetMonth, targetYear);

  for (let index = startIndex; index <= targetIndex; index += 1) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;

    if (!paidMonths.has(`${year}-${month}`)) {
      return { month, year };
    }
  }

  return null;
}

function getFeeType(admissionDue: number, pendingMonths: number) {
  if (admissionDue > 0 && pendingMonths > 0) {
    return "Admission + Monthly" as const;
  }

  return admissionDue > 0 ? ("Admission" as const) : ("Monthly" as const);
}

export async function recordPayment(
  data: RecordPaymentInput
): Promise<ActionResponse<PaymentData>> {
  try {
    await connectDB();

    if (!isValidObjectId(data.memberId)) {
      return { success: false, message: "Invalid member ID." };
    }

    if (!isPaymentType(data.paymentType)) {
      return { success: false, message: "Invalid payment type." };
    }

    if (!isPaymentMode(data.paymentMode)) {
      return { success: false, message: "Payment mode must be Cash or UPI." };
    }

    if (data.amount !== undefined && !isValidAmount(data.amount)) {
      return { success: false, message: "Amount must be zero or greater." };
    }

    const member = await Member.findById(data.memberId);

    if (!member) {
      return { success: false, message: "Member not found." };
    }

    if (data.paymentType === "Admission") {
      if (member.admissionFeePaid) {
        return {
          success: false,
          message: "Admission fee is already paid.",
        };
      }

      const payment = await Payment.create({
        memberId: member._id,
        paymentType: "Admission",
        amount: data.amount ?? member.admissionFee ?? 1200,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        paymentMode: data.paymentMode,
        remarks: data.remarks ?? "",
      });

      member.admissionFeePaid = true;
      await member.save();

      const populatedPayment = await Payment.findById(payment._id)
        .populate("memberId", "name mobileNumber category")
        .lean();

      return {
        success: true,
        message: "Admission payment recorded successfully.",
        data: serialize<PaymentData>(populatedPayment),
      };
    }

    const paymentForMonth = normalizeNumber(data.paymentForMonth);
    const paymentForYear = normalizeNumber(data.paymentForYear);

    if (!isValidMonth(paymentForMonth)) {
      return { success: false, message: "Invalid payment for month." };
    }

    if (!isValidYear(paymentForYear)) {
      return { success: false, message: "Invalid payment for year." };
    }

    const existingPayment = await Payment.findOne(
      getMonthlyDuplicateQuery(
        member._id,
        paymentForMonth,
        paymentForYear
      )
    ).lean();

    if (existingPayment) {
      return {
        success: false,
        message: "Monthly payment already exists for this member and month.",
      };
    }

    const payment = await Payment.create({
      memberId: member._id,
      paymentType: "Monthly",
      amount: data.amount ?? member.monthlyFee,
      paymentForMonth,
      paymentForYear,
      paymentMonth: paymentForMonth,
      paymentYear: paymentForYear,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      paymentMode: data.paymentMode,
      remarks: data.remarks ?? "",
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("memberId", "name mobileNumber category")
      .lean();

    return {
      success: true,
      message: "Monthly payment recorded successfully.",
      data: serialize<PaymentData>(populatedPayment),
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { success: false, message: "Payment already exists." };
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to record payment.",
    };
  }
}

export async function updatePayment(
  id: string,
  data: UpdatePaymentInput
): Promise<ActionResponse<PaymentData>> {
  try {
    await connectDB();

    if (!isValidObjectId(id)) {
      return { success: false, message: "Invalid payment ID." };
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return { success: false, message: "Payment not found." };
    }

    if (data.paymentMode !== undefined && !isPaymentMode(data.paymentMode)) {
      return { success: false, message: "Payment mode must be Cash or UPI." };
    }

    if (data.amount !== undefined && !isValidAmount(data.amount)) {
      return { success: false, message: "Amount must be zero or greater." };
    }

    if (payment.paymentType === "Monthly") {
      const paymentForMonth = normalizeNumber(data.paymentForMonth);
      const paymentForYear = normalizeNumber(data.paymentForYear);

      if (!isValidMonth(paymentForMonth)) {
        return { success: false, message: "Invalid payment for month." };
      }

      if (!isValidYear(paymentForYear)) {
        return { success: false, message: "Invalid payment for year." };
      }

      const duplicate = await Payment.findOne({
        ...getMonthlyDuplicateQuery(
          payment.memberId,
          paymentForMonth,
          paymentForYear
        ),
        _id: { $ne: payment._id },
      }).lean();

      if (duplicate) {
        return {
          success: false,
          message: "Monthly payment already exists for this member and month.",
        };
      }

      payment.paymentForMonth = paymentForMonth;
      payment.paymentForYear = paymentForYear;
      payment.paymentMonth = paymentForMonth;
      payment.paymentYear = paymentForYear;
    }

    if (data.amount !== undefined) payment.amount = data.amount;
    if (data.paymentMode !== undefined) payment.paymentMode = data.paymentMode;
    if (data.paymentDate !== undefined) {
      payment.paymentDate = new Date(data.paymentDate);
    }
    if (data.remarks !== undefined) payment.remarks = data.remarks;

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate("memberId", "name mobileNumber category")
      .lean();

    return {
      success: true,
      message: "Payment updated successfully.",
      data: serialize<PaymentData>(populatedPayment),
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { success: false, message: "Payment already exists." };
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update payment.",
    };
  }
}

export async function deletePayment(id: string): Promise<ActionResponse> {
  try {
    await connectDB();

    if (!isValidObjectId(id)) {
      return { success: false, message: "Invalid payment ID." };
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return { success: false, message: "Payment not found." };
    }

    if (payment.paymentType === "Admission") {
      await Member.findByIdAndUpdate(payment.memberId, {
        admissionFeePaid: false,
      });
    }

    await payment.deleteOne();

    return {
      success: true,
      message: "Payment deleted successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete payment.",
    };
  }
}

export async function getPayments(
  filters: GetPaymentsFilters = {}
): Promise<ActionResponse<PaymentData[]>> {
  try {
    await connectDB();

    const query: Record<string, unknown> = {};

    if (filters.memberId) {
      if (!isValidObjectId(filters.memberId)) {
        return { success: false, message: "Invalid member ID." };
      }

      query.memberId = filters.memberId;
    }

    if (filters.paymentType) {
      if (!isPaymentType(filters.paymentType)) {
        return { success: false, message: "Invalid payment type." };
      }

      query.paymentType = filters.paymentType;
    }

    if (filters.paymentMode) {
      if (!isPaymentMode(filters.paymentMode)) {
        return { success: false, message: "Invalid payment mode." };
      }

      query.paymentMode = filters.paymentMode;
    }

    if (filters.month !== undefined && !isValidMonth(filters.month)) {
      return { success: false, message: "Invalid payment month." };
    }

    if (filters.year !== undefined && !isValidYear(filters.year)) {
      return { success: false, message: "Invalid payment year." };
    }

    if (filters.month !== undefined && filters.year !== undefined) {
      query.$or = [
        {
          paymentForMonth: filters.month,
          paymentForYear: filters.year,
        },
        {
          paymentMonth: filters.month,
          paymentYear: filters.year,
        },
      ];
    } else if (filters.month !== undefined) {
      if (!isValidMonth(filters.month)) {
        return { success: false, message: "Invalid payment month." };
      }

      query.$or = [
        { paymentForMonth: filters.month },
        { paymentMonth: filters.month },
      ];
    } else if (filters.year !== undefined) {
      if (!isValidYear(filters.year)) {
        return { success: false, message: "Invalid payment year." };
      }

      query.$or = [
        { paymentForYear: filters.year },
        { paymentYear: filters.year },
      ];
    }

    if (filters.memberName?.trim()) {
      const members = await Member.find({
        name: { $regex: filters.memberName.trim(), $options: "i" },
      })
        .select("_id")
        .lean();

      query.memberId = { $in: members.map((member) => member._id) };
    }

    const payments = await Payment.find(query)
      .populate("memberId", "name mobileNumber category")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Payments fetched successfully.",
      data: serialize<PaymentData[]>(payments),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch payments.",
    };
  }
}

export async function getMemberPayments(
  memberId: string
): Promise<ActionResponse<PaymentData[]>> {
  try {
    await connectDB();

    if (!isValidObjectId(memberId)) {
      return { success: false, message: "Invalid member ID." };
    }

    const payments = await Payment.find({ memberId })
      .populate("memberId", "name mobileNumber category")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Member payments fetched successfully.",
      data: serialize<PaymentData[]>(payments),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch member payments.",
    };
  }
}

export async function getPendingPayments(
  month: number,
  year: number
): Promise<ActionResponse<PendingPaymentData[]>> {
  try {
    await connectDB();

    if (!isValidMonth(month)) {
      return { success: false, message: "Invalid payment month." };
    }

    if (!isValidYear(year)) {
      return { success: false, message: "Invalid payment year." };
    }

    const activeMembers = await Member.find({ isActive: true }).lean();
    const monthlyPayments = await Payment.find({
      paymentType: "Monthly",
      $or: [{ paymentForYear: { $lte: year } }, { paymentYear: { $lte: year } }],
    })
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    const paidForTargetMonth = new Set(
      monthlyPayments
        .filter(
          (payment) =>
            getPaidForYear(payment) === year &&
            getPaidForMonth(payment) === month
        )
        .map((payment) => String(payment.memberId))
    );

    const paymentsByMember = new Map<string, typeof monthlyPayments>();

    for (const payment of monthlyPayments) {
      const memberKey = String(payment.memberId);
      const memberPayments = paymentsByMember.get(memberKey) ?? [];
      memberPayments.push(payment);
      paymentsByMember.set(memberKey, memberPayments);
    }

    const pendingPayments = activeMembers
      .filter((member) => !paidForTargetMonth.has(String(member._id)))
      .map((member) => {
        const memberPayments = paymentsByMember.get(String(member._id)) ?? [];
        const paidMonths = new Set(
          memberPayments
            .filter((payment) => {
              const paidMonth = getPaidForMonth(payment);
              const paidYear = getPaidForYear(payment);

              if (!paidMonth || !paidYear) {
                return false;
              }

              return monthIndex(paidMonth, paidYear) <= monthIndex(month, year);
            })
            .map((payment) => {
              const paidMonth = getPaidForMonth(payment);
              const paidYear = getPaidForYear(payment);

              return `${paidYear}-${paidMonth}`;
            })
        );
        const pendingMonths = calculatePendingMonths(
          member.joinDate,
          paidMonths,
          month,
          year
        );
        const [lastPayment] = memberPayments;

        return {
          member: serialize<SerializedRecord>(member),
          pendingMonth: { month, year },
          outstandingAmount: member.monthlyFee * pendingMonths,
          pendingMonths,
          lastPaymentDate: lastPayment?.paymentDate
            ? new Date(lastPayment.paymentDate).toISOString()
            : null,
        };
      });

    return {
      success: true,
      message: "Pending payments fetched successfully.",
      data: pendingPayments,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending payments.",
    };
  }
}

export async function getPendingFeesSummary(
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear()
): Promise<ActionResponse<PendingFeesSummaryData>> {
  try {
    await connectDB();

    if (!isValidMonth(month)) {
      return { success: false, message: "Invalid payment month." };
    }

    if (!isValidYear(year)) {
      return { success: false, message: "Invalid payment year." };
    }

    const [members, monthlyPayments] = await Promise.all([
      Member.find({ isActive: true }).lean(),
      Payment.find({
        paymentType: "Monthly",
        $or: [{ paymentForYear: { $lte: year } }, { paymentYear: { $lte: year } }],
      }).lean(),
    ]);
    const paymentsByMember = new Map<string, typeof monthlyPayments>();

    for (const payment of monthlyPayments) {
      const memberKey = String(payment.memberId);
      const memberPayments = paymentsByMember.get(memberKey) ?? [];
      memberPayments.push(payment);
      paymentsByMember.set(memberKey, memberPayments);
    }

    const items = members
      .map((member) => {
        const memberPayments = paymentsByMember.get(String(member._id)) ?? [];
        const paidMonths = new Set(
          memberPayments
            .map((payment) => {
              const paidMonth = getPaidForMonth(payment);
              const paidYear = getPaidForYear(payment);

              return paidMonth && paidYear ? `${paidYear}-${paidMonth}` : "";
            })
            .filter(Boolean)
        );
        const pendingMonths = calculatePendingMonths(
          member.joinDate,
          paidMonths,
          month,
          year
        );
        const oldestPendingMonth = getOldestPendingMonth(
          member.joinDate,
          paidMonths,
          month,
          year
        );
        const admissionDue = member.admissionFeePaid ? 0 : member.admissionFee;
        const monthlyDue = pendingMonths * member.monthlyFee;
        const outstandingAmount = admissionDue + monthlyDue;

        if (outstandingAmount <= 0) {
          return null;
        }

        return {
          member: serialize<SerializedRecord>(member),
          feeType: getFeeType(admissionDue, pendingMonths),
          pendingMonths,
          admissionDue,
          monthlyDue,
          outstandingAmount,
          oldestPendingMonth,
        };
      })
      .filter((item): item is PendingFeeQueueItem => Boolean(item))
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount);
    const totalOutstandingAmount = items.reduce(
      (total, item) => total + item.outstandingAmount,
      0
    );

    return {
      success: true,
      message: "Pending fees fetched successfully.",
      data: {
        pendingMembersCount: items.length,
        totalOutstandingAmount,
        items,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch pending fees.",
    };
  }
}

export async function getRevenue(
  month: number,
  year: number
): Promise<ActionResponse<RevenueData>> {
  try {
    await connectDB();

    if (!isValidMonth(month)) {
      return { success: false, message: "Invalid payment month." };
    }

    if (!isValidYear(year)) {
      return { success: false, message: "Invalid payment year." };
    }

    const activeMembers = await Member.find({ isActive: true })
      .select("_id monthlyFee")
      .lean();
    const payments = await Payment.find({
      paymentType: "Monthly",
      $or: [
        { paymentForMonth: month, paymentForYear: year },
        { paymentMonth: month, paymentYear: year },
      ],
    }).lean();

    const activeMemberIds = new Set(
      activeMembers.map((member) => String(member._id))
    );
    const activeMemberPayments = payments.filter((payment) =>
      activeMemberIds.has(String(payment.memberId))
    );
    const paidMemberIds = new Set(
      activeMemberPayments.map((payment) => String(payment.memberId))
    );
    const expectedRevenue = activeMembers.reduce(
      (total, member) => total + member.monthlyFee,
      0
    );
    const collectedRevenue = activeMemberPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    return {
      success: true,
      message: "Revenue fetched successfully.",
      data: {
        collectedRevenue,
        expectedRevenue,
        pendingRevenue: expectedRevenue - collectedRevenue,
        activeMembers: activeMembers.length,
        paidMembers: paidMemberIds.size,
        pendingMembers: activeMembers.length - paidMemberIds.size,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch revenue.",
    };
  }
}
