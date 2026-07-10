"use server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/attendance";
import Member from "@/models/member";
import Payment from "@/models/payments";

type MemberCategory = "Male" | "Female" | "Student";

type SerializedRecord = Record<string, unknown>;

export type MemberData = {
  _id: string;
  name: string;
  mobileNumber: string;
  category: MemberCategory;
  monthlyFee: number;
  admissionFee: number;
  admissionFeePaid: boolean;
  joinDate: string;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentHistoryData = SerializedRecord;
export type AttendanceHistoryData = SerializedRecord;

export type ActionResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

export type CreateMemberInput = {
  name: string;
  mobileNumber: string;
  category: MemberCategory;
  admissionFeePaid?: boolean;
  joinDate?: Date | string;
  isActive?: boolean;
  notes?: string;
};

export type UpdateMemberInput = Partial<CreateMemberInput>;

export type GetMembersParams = {
  search?: string;
  active?: boolean;
  category?: MemberCategory | string;
};

export type GetMemberByIdParams = {
  attendanceYear?: number;
};

export type MemberDetailsData = {
  member: MemberData;
  paymentHistory: PaymentHistoryData[];
  attendanceHistory: AttendanceHistoryData[];
};

const MONTHLY_FEES: Record<MemberCategory, number> = {
  Male: 900,
  Female: 800,
  Student: 800,
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isMemberCategory(category: unknown): category is MemberCategory {
  return (
    category === "Male" ||
    category === "Female" ||
    category === "Student"
  );
}

function getMonthlyFee(category: MemberCategory) {
  return MONTHLY_FEES[category];
}

function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isValidHistoryYear(year: unknown): year is number {
  return (
    typeof year === "number" &&
    Number.isInteger(year) &&
    year >= 1900 &&
    year <= 9999
  );
}

function getYearRange(year: number) {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
  };
}

export async function createMember(
  data: CreateMemberInput
): Promise<ActionResponse<MemberData>> {
  try {
    await connectDB();

    if (!isMemberCategory(data.category)) {
      return {
        success: false,
        message: "Invalid member category.",
      };
    }

    const existingMember = await Member.findOne({
      mobileNumber: data.mobileNumber,
    }).lean();

    if (existingMember) {
      return {
        success: false,
        message: "A member with this mobile number already exists.",
      };
    }

    const member = await Member.create({
      ...data,
      category: data.category,
      monthlyFee: getMonthlyFee(data.category),
      admissionFee: 1200,
    });

    return {
      success: true,
      message: "Member created successfully.",
      data: serialize<MemberData>(member.toObject()),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create member.",
    };
  }
}

export async function updateMember(
  id: string,
  data: UpdateMemberInput
): Promise<ActionResponse<MemberData>> {
  try {
    await connectDB();

    if (!isValidObjectId(id)) {
      return {
        success: false,
        message: "Invalid member ID.",
      };
    }

    if (data.category !== undefined && !isMemberCategory(data.category)) {
      return {
        success: false,
        message: "Invalid member category.",
      };
    }

    if (data.mobileNumber) {
      const duplicateMember = await Member.findOne({
        _id: { $ne: id },
        mobileNumber: data.mobileNumber,
      }).lean();

      if (duplicateMember) {
        return {
          success: false,
          message: "A member with this mobile number already exists.",
        };
      }
    }

    const updateData = {
      ...data,
      ...(data.category
        ? { monthlyFee: getMonthlyFee(data.category) }
        : {}),
    };

    const member = await Member.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!member) {
      return {
        success: false,
        message: "Member not found.",
      };
    }

    return {
      success: true,
      message: "Member updated successfully.",
      data: serialize<MemberData>(member),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update member.",
    };
  }
}

export async function deleteMember(
  id: string
): Promise<ActionResponse> {
  try {
    await connectDB();

    if (!isValidObjectId(id)) {
      return {
        success: false,
        message: "Invalid member ID.",
      };
    }

    const member = await Member.findById(id).lean();

    if (!member) {
      return {
        success: false,
        message: "Member not found.",
      };
    }

    await Attendance.deleteMany({ memberId: id });
    await Payment.deleteMany({ memberId: id });
    await Member.findByIdAndDelete(id);

    return {
      success: true,
      message: "Member deleted successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete member.",
    };
  }
}

export async function getMembers(
  params: GetMembersParams = {}
): Promise<ActionResponse<MemberData[]>> {
  try {
    await connectDB();

    const query: Record<string, unknown> = {};

    if (params.search?.trim()) {
      const search = params.search.trim();
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (typeof params.active === "boolean") {
      query.isActive = params.active;
    }

    if (params.category) {
      if (!isMemberCategory(params.category)) {
        return {
          success: false,
          message: "Invalid member category.",
        };
      }

      query.category = params.category;
    }

    const members = await Member.find(query)
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      message: "Members fetched successfully.",
      data: serialize<MemberData[]>(members),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch members.",
    };
  }
}

export async function getMemberById(
  id: string,
  params: GetMemberByIdParams = {}
): Promise<ActionResponse<MemberDetailsData>> {
  try {
    await connectDB();

    if (!isValidObjectId(id)) {
      return {
        success: false,
        message: "Invalid member ID.",
      };
    }

    const member = await Member.findById(id).lean();

    if (!member) {
      return {
        success: false,
        message: "Member not found.",
      };
    }

    if (
      params.attendanceYear !== undefined &&
      !isValidHistoryYear(params.attendanceYear)
    ) {
      return {
        success: false,
        message: "Invalid attendance year.",
      };
    }

    const paymentHistory = await Payment.find({ memberId: id })
      .populate("memberId", "name mobileNumber category")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    const attendanceQuery: Record<string, unknown> = { memberId: id };

    if (params.attendanceYear !== undefined) {
      const { start, end } = getYearRange(params.attendanceYear);
      attendanceQuery.date = { $gte: start, $lt: end };
    }

    const attendanceHistory = await Attendance.find(attendanceQuery)
      .populate("memberId", "name mobileNumber category")
      .sort({ date: -1, timeIn: -1 })
      .lean();

    return {
      success: true,
      message: "Member details fetched successfully.",
      data: {
        member: serialize<MemberData>(member),
        paymentHistory: serialize<PaymentHistoryData[]>(paymentHistory),
        attendanceHistory:
          serialize<AttendanceHistoryData[]>(attendanceHistory),
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch member details.",
    };
  }
}
