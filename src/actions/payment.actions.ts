"use server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Member from "@/models/member";
import Payment from "@/models/payments";

type PaymentType = "Admission" | "Monthly";
type PaymentMode = "Cash" | "UPI";
type SerializedRecord = Record<string, unknown>;

export type ActionResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

export type RecordPaymentInput = {
  memberId: string;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  paymentMonth?: number;
  paymentYear?: number;
  remarks?: string;
};

export type GetPaymentsFilters = {
  month?: number;
  year?: number;
  paymentType?: PaymentType;
  paymentMode?: PaymentMode;
  memberName?: string;
};

export type PaymentData = {
  _id: string;
  memberId: string | SerializedRecord;
  paymentType: PaymentType;
  amount: number;
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

export async function recordPayment(
  data: RecordPaymentInput
): Promise<ActionResponse<PaymentData>> {
  try {
    await connectDB();

    if (!isValidObjectId(data.memberId)) {
      return {
        success: false,
        message: "Invalid member ID.",
      };
    }

    if (!isPaymentType(data.paymentType)) {
      return {
        success: false,
        message: "Invalid payment type.",
      };
    }

    if (!isPaymentMode(data.paymentMode)) {
      return {
        success: false,
        message: "Payment mode must be Cash or UPI.",
      };
    }

    const member = await Member.findById(data.memberId);

    if (!member) {
      return {
        success: false,
        message: "Member not found.",
      };
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
        amount: 1200,
        paymentMode: data.paymentMode,
        remarks: data.remarks ?? "",
      });

      member.admissionFeePaid = true;
      await member.save();

      const populatedPayment = await Payment.findById(payment._id)
        .populate("memberId", "name")
        .lean();

      return {
        success: true,
        message: "Admission payment recorded successfully.",
        data: serialize<PaymentData>(populatedPayment),
      };
    }

    if (!isValidMonth(data.paymentMonth)) {
      return {
        success: false,
        message: "Invalid payment month.",
      };
    }

    if (!isValidYear(data.paymentYear)) {
      return {
        success: false,
        message: "Invalid payment year.",
      };
    }

    const existingPayment = await Payment.findOne({
      memberId: member._id,
      paymentType: "Monthly",
      paymentMonth: data.paymentMonth,
      paymentYear: data.paymentYear,
    }).lean();

    if (existingPayment) {
      return {
        success: false,
        message: "Monthly payment already exists for this member and month.",
      };
    }

    const payment = await Payment.create({
      memberId: member._id,
      paymentType: "Monthly",
      amount: member.monthlyFee,
      paymentMonth: data.paymentMonth,
      paymentYear: data.paymentYear,
      paymentMode: data.paymentMode,
      remarks: data.remarks ?? "",
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("memberId", "name")
      .lean();

    return {
      success: true,
      message: "Monthly payment recorded successfully.",
      data: serialize<PaymentData>(populatedPayment),
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        success: false,
        message: "Payment already exists.",
      };
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to record payment.",
    };
  }
}

export async function getPayments(
  filters: GetPaymentsFilters = {}
): Promise<ActionResponse<PaymentData[]>> {
  try {
    await connectDB();

    const query: Record<string, unknown> = {};

    if (filters.paymentType) {
      if (!isPaymentType(filters.paymentType)) {
        return {
          success: false,
          message: "Invalid payment type.",
        };
      }

      query.paymentType = filters.paymentType;
    }

    if (filters.paymentMode) {
      if (!isPaymentMode(filters.paymentMode)) {
        return {
          success: false,
          message: "Invalid payment mode.",
        };
      }

      query.paymentMode = filters.paymentMode;
    }

    if (filters.month !== undefined) {
      if (!isValidMonth(filters.month)) {
        return {
          success: false,
          message: "Invalid payment month.",
        };
      }

      query.paymentMonth = filters.month;
    }

    if (filters.year !== undefined) {
      if (!isValidYear(filters.year)) {
        return {
          success: false,
          message: "Invalid payment year.",
        };
      }

      query.paymentYear = filters.year;
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
      .populate("memberId", "name")
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
      return {
        success: false,
        message: "Invalid member ID.",
      };
    }

    const payments = await Payment.find({ memberId })
      .populate("memberId", "name")
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
      return {
        success: false,
        message: "Invalid payment month.",
      };
    }

    if (!isValidYear(year)) {
      return {
        success: false,
        message: "Invalid payment year.",
      };
    }

    const activeMembers = await Member.find({ isActive: true }).lean();
    const monthlyPayments = await Payment.find({
      paymentType: "Monthly",
      paymentYear: { $lte: year },
    })
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    const paidForTargetMonth = new Set(
      monthlyPayments
        .filter(
          (payment) =>
            String(payment.paymentYear) === String(year) &&
            String(payment.paymentMonth) === String(month)
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
              if (!payment.paymentMonth || !payment.paymentYear) {
                return false;
              }

              return (
                monthIndex(payment.paymentMonth, payment.paymentYear) <=
                monthIndex(month, year)
              );
            })
            .map((payment) => `${payment.paymentYear}-${payment.paymentMonth}`)
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
          pendingMonth: {
            month,
            year,
          },
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

export async function getRevenue(
  month: number,
  year: number
): Promise<ActionResponse<RevenueData>> {
  try {
    await connectDB();

    if (!isValidMonth(month)) {
      return {
        success: false,
        message: "Invalid payment month.",
      };
    }

    if (!isValidYear(year)) {
      return {
        success: false,
        message: "Invalid payment year.",
      };
    }

    const activeMembers = await Member.find({ isActive: true })
      .select("_id monthlyFee")
      .lean();
    const payments = await Payment.find({
      paymentType: "Monthly",
      paymentMonth: month,
      paymentYear: year,
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
