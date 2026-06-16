import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Per-lesson progress for a student: completion flag, last watch position
 * (for resume playback), and free-text notes the student takes while watching.
 */
const ProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    completed: { type: Boolean, default: false },
    watchTime: { type: Number, default: 0 }, // last position in seconds (resume)
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

ProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export type ProgressDoc = InferSchemaType<typeof ProgressSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Progress = models.Progress || model("Progress", ProgressSchema);
export default Progress;
