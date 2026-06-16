import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

// Target audiences relevant to Indian govt-exam prep.
export const TARGET_EXAMS = [
  "SSC",
  "UPSC",
  "Banking",
  "Railways",
  "State PSC",
  "Defence (NDA/CDS)",
  "Class 9-10 Boards",
  "Class 11-12 Boards",
  "Graduate / General",
] as const;

export const CLASS_LEVELS = ["Class 9", "Class 10", "Class 11", "Class 12", "Graduate"] as const;

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" }, // rich-text HTML from TipTap
    shortDescription: { type: String, maxlength: 280 },
    thumbnail: { type: String }, // public URL
    price: { type: Number, required: true, min: 0 }, // in INR rupees
    discount: { type: Number, default: 0, min: 0, max: 100 }, // percent

    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    category: { type: String, index: true }, // e.g. "Mathematics", "Reasoning"
    subject: { type: String, index: true },
    targetExam: { type: String, enum: TARGET_EXAMS, index: true },
    classLevel: { type: String, enum: CLASS_LEVELS, index: true },
    language: { type: String, default: "Hindi" },
    tags: [{ type: String }],

    // Workflow: teacher submits -> admin approves -> published.
    isPublished: { type: Boolean, default: false, index: true },
    approvalStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    rejectionReason: { type: String },

    // Denormalised counters kept in sync on enrollment for fast catalog reads.
    enrollmentCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CourseSchema.index({ title: "text", shortDescription: "text", tags: "text" });

export type CourseDoc = InferSchemaType<typeof CourseSchema> & { _id: mongoose.Types.ObjectId };

export const Course = models.Course || model("Course", CourseSchema);
export default Course;
