import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A single video lesson. `videoKey` is the PRIVATE R2 object key — never the
 * raw URL. Playback URLs are signed on demand. `isPreview` lets teachers expose
 * a free sample lesson on the public course page.
 */
const LessonSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true, index: true },
    title: { type: String, required: true, trim: true },
    videoKey: { type: String }, // R2 object key, e.g. "courses/<id>/lesson-abc.mp4"
    duration: { type: Number, default: 0 }, // seconds
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
    resources: [{ name: String, key: String }], // optional downloadable PDFs/notes
  },
  { timestamps: true }
);

export type LessonDoc = InferSchemaType<typeof LessonSchema> & { _id: mongoose.Types.ObjectId };

export const Lesson = models.Lesson || model("Lesson", LessonSchema);
export default Lesson;
