import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Links a student to a purchased course. `progress` is a cached 0-100 percent
 * recomputed whenever a lesson is marked complete. A unique compound index
 * prevents duplicate enrollments.
 */
const EnrollmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    purchaseDate: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedAt: { type: Date }, // set when progress hits 100; gate for certificate
    certificateId: { type: String }, // unique id printed on the certificate
  },
  { timestamps: true }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export type EnrollmentDoc = InferSchemaType<typeof EnrollmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Enrollment = models.Enrollment || model("Enrollment", EnrollmentSchema);
export default Enrollment;
