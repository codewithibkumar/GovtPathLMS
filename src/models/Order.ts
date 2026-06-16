import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A Razorpay purchase. Created at checkout-initiate time with status "created",
 * flipped to "paid" by signature verification or webhook. `amount` is stored in
 * rupees for readability (Razorpay itself works in paise).
 */
const OrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true }, // INR rupees
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
      index: true,
    },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: mongoose.Types.ObjectId };

export const Order = models.Order || model("Order", OrderSchema);
export default Order;
