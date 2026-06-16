/**
 * Seed script — creates demo admin/teacher/student accounts and sample courses.
 * Run with:  npm run seed
 * Uses relative imports so it works under tsx without path-alias resolution.
 */
import { config } from "dotenv";
// Load local env (Next.js convention) so MONGODB_URI is available to the script.
config({ path: ".env.local" });
config(); // fall back to .env
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import User from "../src/models/User";
import Course from "../src/models/Course";
import Module from "../src/models/Module";
import Lesson from "../src/models/Lesson";
import { slugify } from "../src/lib/utils";

async function main() {
  await connectDB();
  console.log("Connected. Clearing demo data…");

  await Promise.all([
    User.deleteMany({ email: /@govpath\.demo$/ }),
  ]);

  const pwd = await bcrypt.hash("Password123", 10);

  const [admin, teacher] = await User.create([
    { name: "Platform Admin", email: "admin@govpath.demo", password: pwd, role: "admin" },
    {
      name: "Prof. Rohan Verma",
      email: "teacher@govpath.demo",
      password: pwd,
      role: "teacher",
      bio: "10+ years coaching SSC & Banking aspirants. Loves making maths simple.",
    },
  ]);
  await User.create({ name: "Aarti Student", email: "student@govpath.demo", password: pwd, role: "student" });

  console.log("Creating sample courses…");
  const samples = [
    {
      title: "SSC CGL Quantitative Aptitude — Complete Course",
      targetExam: "SSC",
      classLevel: "Graduate",
      subject: "Mathematics",
      price: 1499,
      discount: 40,
      thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800",
      shortDescription: "Master arithmetic, algebra, geometry & DI for SSC CGL Tier 1 & 2.",
    },
    {
      title: "Banking Reasoning Masterclass (IBPS/SBI PO)",
      targetExam: "Banking",
      classLevel: "Graduate",
      subject: "Reasoning",
      price: 999,
      discount: 25,
      thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
      shortDescription: "Puzzles, seating arrangement, syllogism — solve faster with shortcuts.",
    },
    {
      title: "Class 12 Physics — Board + Competitive Foundation",
      targetExam: "Class 11-12 Boards",
      classLevel: "Class 12",
      subject: "Physics",
      price: 1999,
      discount: 30,
      thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800",
      shortDescription: "Concept-first physics aligned to CBSE boards and JEE/NEET basics.",
    },
  ];

  for (const s of samples) {
    const course = await Course.create({
      ...s,
      slug: slugify(s.title),
      description: `<p>${s.shortDescription}</p><p>This course includes structured modules, solved examples and weekly practice. Ideal for serious aspirants.</p>`,
      teacherId: teacher._id,
      language: "Hindi",
      approvalStatus: "approved",
      isPublished: true,
      enrollmentCount: Math.floor(Math.random() * 500),
      ratingAvg: 4 + Math.random(),
      ratingCount: Math.floor(Math.random() * 200),
    });

    for (let m = 1; m <= 3; m++) {
      const mod = await Module.create({ courseId: course._id, title: `Module ${m}`, order: m });
      for (let l = 1; l <= 4; l++) {
        await Lesson.create({
          courseId: course._id,
          moduleId: mod._id,
          title: `Lesson ${m}.${l}`,
          // Demo lessons have no real videoKey; the first lesson is a free preview.
          duration: 300 + Math.floor(Math.random() * 1200),
          order: l,
          isPreview: m === 1 && l === 1,
        });
      }
    }
    console.log(`  ✓ ${course.title}`);
  }

  console.log("\nDemo logins (password: Password123):");
  console.log("  admin@govpath.demo  | teacher@govpath.demo | student@govpath.demo");

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
