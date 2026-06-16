import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/** A section/chapter within a course. Ordered via `order`. */
const ModuleSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ModuleDoc = InferSchemaType<typeof ModuleSchema> & { _id: mongoose.Types.ObjectId };

export const Module = models.Module || model("Module", ModuleSchema);
export default Module;
