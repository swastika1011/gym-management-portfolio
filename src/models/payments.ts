import { Schema, model, models } from "mongoose";

const paymentSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    paymentType: {
      type: String,
      enum: ["Admission", "Monthly"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentForMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: undefined,
      required: [
        function (this: { paymentType?: string }) {
          return this.paymentType === "Monthly";
        },
        "Payment for month is required for monthly payments.",
      ],
    },

    paymentForYear: {
      type: Number,
      default: undefined,
      required: [
        function (this: { paymentType?: string }) {
          return this.paymentType === "Monthly";
        },
        "Payment for year is required for monthly payments.",
      ],
    },

    paymentMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: undefined,
    },

    paymentYear: {
      type: Number,
      default: undefined,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI"],
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Admission payments do not need month/year
paymentSchema.pre("validate", function (this: {
  paymentType: string;
  paymentForMonth?: number;
  paymentForYear?: number;
  paymentMonth?: number;
  paymentYear?: number;
}) {
  if (this.paymentType === "Admission") {
    this.paymentForMonth = undefined;
    this.paymentForYear = undefined;
    this.paymentMonth = undefined;
    this.paymentYear = undefined;
  }
});

// Prevent duplicate monthly payments
paymentSchema.index(
  {
    memberId: 1,
    paymentType: 1,
    paymentForMonth: 1,
    paymentForYear: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      paymentType: "Monthly",
    },
  }
);

// Prevent duplicate admission fee payments
paymentSchema.index(
  {
    memberId: 1,
    paymentType: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      paymentType: "Admission",
    },
  }
);

const Payment = models.Payment || model("Payment", paymentSchema);

export default Payment;
