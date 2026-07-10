import { Schema, model, models } from "mongoose";

const memberSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Male", "Female", "Student"],
      required: true,
    },

    monthlyFee: {
      type: Number,
      required: true,
      min: 0,
    },

    admissionFee: {
      type: Number,
      default: 1200,
      min: 0,
    },

    admissionFeePaid: {
      type: Boolean,
      default: false,
    },

    joinDate: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

memberSchema.index({ mobileNumber: 1 }, { unique: true });

const Member = models.Member || model("Member", memberSchema);

export default Member;