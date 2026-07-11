import { Schema, model, models } from "mongoose";

const attendanceSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    timeIn: {
      type: Date,
      required: true,
      default: Date.now,
    },

    timeOut: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index(
  { memberId: 1, date: 1 },
  { unique: true }
);

const Attendance =
  models.Attendance || model("Attendance", attendanceSchema);

export default Attendance;