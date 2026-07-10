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

paymentMonth: {
  type: Number,
  min: 1,
  max: 12,
  required: function (this: { paymentType: string }) {
    return this.paymentType === "Monthly";
  },
},

    paymentYear: {
      type: Number,
      required: function () {
        return this.paymentType === "Monthly";
      },
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
  paymentMonth?: number;
  paymentYear?: number;
}) {
  if (this.paymentType === "Admission") {
    this.paymentMonth = undefined;
    this.paymentYear = undefined;
  }
});

// Prevent duplicate monthly payments
paymentSchema.index(
  {
    memberId: 1,
    paymentType: 1,
    paymentMonth: 1,
    paymentYear: 1,
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