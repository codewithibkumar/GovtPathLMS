import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const ROLES = ["student", "teacher", "admin"] as const;
export type Role = (typeof ROLES)[number];

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Hashed with bcrypt. Optional because Google-OAuth users have no password.
    password: { type: String, select: false },
    role: { type: String, enum: ROLES, default: "student", index: true },
    avatar: { type: String },
    bio: { type: String }, // shown on instructor public profile
    provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = models.User || model("User", UserSchema);
export default User;
