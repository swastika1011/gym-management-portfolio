"use server";

import mongoose from "mongoose";

import { getDateRange, normalizeDate } from "@/lib/date";
import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/attendance";
import Member from "@/models/member";

type SerializedRecord = Record<string, unknown>;

export type ActionResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

export type AttendanceData = {
  _id: string;
  memberId: string | SerializedRecord;
  date: string;
  timeIn: string;
  timeOut: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarkAttendanceInput = {
  memberId: string;
  date?: Date | string;
  timeIn?: Date | string;
};

export type GetAttendanceFilters = {
  name?: string;
  date?: Date | string;
};

export type TodayAttendanceData = {
  attendance: AttendanceData[];
  presentCount: number;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
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

export async function markAttendance(
  data: MarkAttendanceInput
): Promise<ActionResponse<AttendanceData>> {
  try {
    await connectDB();

    if (!isValidObjectId(data.memberId)) {
      return {
        success: false,
        message: "Invalid member ID.",
      };
    }

const member = await Member.findById(data.memberId)
  .select("isActive")
  .lean();

if (!member) {
  return {
    success: false,
    message: "Member not found.",
  };
}

if (!member.isActive) {
  return {
    success: false,
    message: "Cannot mark attendance for an inactive member.",
  };
}
    const attendanceDate = normalizeDate(data.date);
    const { start, end } = getDateRange(attendanceDate);
    const existingAttendance = await Attendance.findOne({
      memberId: data.memberId,
      date: { $gte: start, $lt: end },
    }).lean();

    if (existingAttendance) {
      return {
        success: false,
        message: "Attendance already marked for this member on this date.",
      };
    }

    const attendance = await Attendance.create({
      memberId: data.memberId,
      date: attendanceDate,
      timeIn: data.timeIn ? new Date(data.timeIn) : new Date(),
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("memberId", "name mobileNumber")
      .lean();

    if (!populatedAttendance) {
      return {
        success: false,
        message: "Attendance was created but could not be loaded.",
      };
    }

    return {
      success: true,
      message: "Attendance marked successfully.",
      data: serialize<AttendanceData>(populatedAttendance),
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        success: false,
        message: "Attendance already marked for this member on this date.",
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark attendance.",
    };
  }
}

export async function checkoutAttendance(
  id: string
): Promise<ActionResponse<AttendanceData>> {
  try {
    await connectDB();

    if (!isValidObjectId(id)) {
      return {
        success: false,
        message: "Invalid attendance ID.",
      };
    }

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      { timeOut: new Date() },
      { new: true, runValidators: true }
    )
      .populate("memberId", "name mobileNumber")
      .lean();

    if (!attendance) {
      return {
        success: false,
        message: "Attendance record not found.",
      };

    }

    return {
      success: true,
      message: "Attendance checkout updated successfully.",
      data: serialize<AttendanceData>(attendance),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to checkout attendance.",
    };
  }
}

export async function getAttendance(
  filters: GetAttendanceFilters = {}
): Promise<ActionResponse<AttendanceData[]>> {
  try {
    await connectDB();

    const query: Record<string, unknown> = {};

    if (filters.date) {
      const { start, end } = getDateRange(filters.date);
      query.date = { $gte: start, $lt: end };
    }

    if (filters.name?.trim()) {
      const members = await Member.find({
        name: { $regex: filters.name.trim(), $options: "i" },
      })
        .select("_id")
        .lean();

      query.memberId = { $in: members.map((member) => member._id) };
    }

    const attendance = await Attendance.find(query)
      .populate("memberId", "name mobileNumber")
      .sort({ date: -1, timeIn: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Attendance fetched successfully.",
      data: serialize<AttendanceData[]>(attendance),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch attendance.",
    };
  }
}

export async function getTodayAttendance(): Promise<
  ActionResponse<TodayAttendanceData>
> {
  try {
    await connectDB();

    const { start, end } = getDateRange();
    const attendance = await Attendance.find({
      date: { $gte: start, $lt: end },
    })
      .populate("memberId", "name mobileNumber")
      .sort({ timeIn: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Today's attendance fetched successfully.",
      data: {
        attendance: serialize<AttendanceData[]>(attendance),
        presentCount: attendance.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch today's attendance.",
    };
  }
}
