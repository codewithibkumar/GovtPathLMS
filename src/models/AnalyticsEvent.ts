import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const EVENT_TYPES = [
  "course_visited",
  "checkout_initiated",
  "checkout_completed",
  "checkout_abandoned",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Lightweight CRM/funnel event log. Written from both client (page visits) and
 * server (checkout lifecycle). Admin analytics aggregates over this collection.
 */
const AnalyticsEventSchema = new Schema(
  {
    type: { type: String, enum: EVENT_TYPES, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true }, // null for anon visitors
    courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    amount: { type: Number }, // revenue on checkout_completed
    sessionId: { type: String, index: true }, // anonymous visitor id (cookie)
    meta: { type: Schema.Types.Mixed }, // referrer, utm, device, etc.
  },
  { timestamps: true }
);

// Common dashboard query: events of a type within a date range.
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });

export type AnalyticsEventDoc = InferSchemaType<typeof AnalyticsEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AnalyticsEvent =
  models.AnalyticsEvent || model("AnalyticsEvent", AnalyticsEventSchema);
export default AnalyticsEvent;
