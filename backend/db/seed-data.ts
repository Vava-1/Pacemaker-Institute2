import { createConnection } from "mysql2/promise";
import crypto from "crypto";

const UNSPLASH_CATEGORIES: Record<string, string[]> = {
  English: [
    "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
  ],
  French: [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    "https://images.unsplash.com/photo-1491557345352-5929e343d89f?w=800",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
  ],
  Kiswahili: [
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
  ],
  German: [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
    "https://images.unsplash.com/photo-1523050854058-8df90110c7f9?w=800",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800",
  ],
  Bakery: [
    "https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=800",
    "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=800",
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
  ],
  Salon: [
    "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
  ],
  Mechanics: [
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800",
    "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800",
  ],
  "AI Skills for Professionals": [
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800",
    "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800",
  ],
  "Private Candidate Support": [
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
  ],
};

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const EXERCISE_TYPES = ["multiple_choice", "fill_blank", "true_false"] as const;
const LANGUAGES = ["en", "fr", "sw", "de"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(1, daysAgo));
  d.setHours(randomInt(0, 23), randomInt(0, 59));
  return d;
}

async function seed() {
  const conn = await createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    database: "pacemaker",
  });

  console.log("Connected. Seeding data...");

  // ── 1. Unique Course Thumbnails ──
  const [courses] = await conn.execute("SELECT id, title, category_id FROM courses ORDER BY id");
  const courseRows = courses as any[];
  const catImageIndex: Record<string, number> = {};

  for (const course of courseRows) {
    const [catRows] = await conn.execute("SELECT name FROM categories WHERE id = ?", [course.category_id]);
    const catName = (catRows as any[])[0]?.name ?? "Unknown";
    const images = UNSPLASH_CATEGORIES[catName] ?? UNSPLASH_CATEGORIES["English"];
    const idx = (catImageIndex[catName] ?? 0) % images.length;
    catImageIndex[catName] = idx + 1;

    await conn.execute("UPDATE courses SET thumbnail = ? WHERE id = ?", [images[idx], course.id]);
  }
  console.log(`✓ Updated ${courseRows.length} course thumbnails`);

  // ── 1b. Update prices to RWF ──
  const rwfPrices: Record<number, { price: number; original: number }> = {
    1:  { price: 120000, original: 150000 },
    2:  { price: 150000, original: 180000 },
    3:  { price: 200000, original: 250000 },
    4:  { price: 120000, original: 150000 },
    5:  { price: 150000, original: 180000 },
    6:  { price: 200000, original: 250000 },
    7:  { price: 120000, original: 140000 },
    8:  { price: 130000, original: 160000 },
    9:  { price: 180000, original: 220000 },
    10: { price: 120000, original: 150000 },
    11: { price: 150000, original: 180000 },
    12: { price: 200000, original: 250000 },
    13: { price: 250000, original: 300000 },
    14: { price: 200000, original: 250000 },
    15: { price: 180000, original: 220000 },
    16: { price: 150000, original: 180000 },
    17: { price: 200000, original: 250000 },
  };
  for (const [cid, p] of Object.entries(rwfPrices)) {
    await conn.execute("UPDATE courses SET price = ?, original_price = ?, currency = 'rwf' WHERE id = ?", [p.price, p.original, Number(cid)]);
  }
  console.log(`✓ Updated ${Object.keys(rwfPrices).length} course prices to RWF`);

  // ── 2. Exercises ──
  const exerciseTemplates: Record<string, { title: string; question: string }[]> = {
    English: [
      { title: "Vocabulary Quiz", question: "What is the correct meaning of the word 'ubiquitous'?" },
      { title: "Grammar Check", question: "Which sentence uses the present perfect correctly?" },
      { title: "Reading Comprehension", question: "Read the passage and answer: What is the main idea?" },
    ],
    French: [
      { title: "Vocabulaire Français", question: "Quelle est la traduction correcte de 'however' ?" },
      { title: "Conjugaison", question: "Conjuguez le verbe 'être' au présent." },
      { title: "Compréhension", question: "Lisez le texte et répondez à la question." },
    ],
    Kiswahili: [
      { title: "Msamiati", question: "Maana ya neno 'ujasiriamali' ni nini?" },
      { title: "Sarufi", question: "Tumia kitenzi 'kula' katika wakati uliopo." },
      { title: "Ufahamu", question: "Soma kifungu kisha ujibu maswali." },
    ],
    German: [
      { title: "Wortschatz", question: "Was bedeutet das Wort 'nachhaltigkeit'?" },
      { title: "Grammatik", question: "Setzen Sie das richtige Artikel ein." },
      { title: "Leseverständnis", question: "Lesen Sie den Text und beantworten Sie die Frage." },
    ],
  };

  let exerciseCount = 0;
  for (const course of courseRows) {
    const [catRows] = await conn.execute("SELECT name, id FROM categories WHERE id = ?", [course.category_id]);
    const catName = (catRows as any[])[0]?.name ?? "English";
    const temps = exerciseTemplates[catName] ?? exerciseTemplates["English"];

    for (const t of temps) {
      const lang = catName === "French" ? "fr" : catName === "Kiswahili" ? "sw" : catName === "German" ? "de" : "en";
      await conn.execute(
        `INSERT INTO exercises (course_id, category_id, title, question, type, difficulty, points, language, is_daily, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          course.id,
          course.category_id,
          t.title,
          t.question,
          pick(EXERCISE_TYPES),
          pick(DIFFICULTIES),
          randomInt(5, 20),
          lang,
          false,
          randomDate(60),
        ],
      );
      exerciseCount++;
    }
  }
  console.log(`✓ Created ${exerciseCount} exercises`);

  // ── 3. Enrollments ──
  const [users] = await conn.execute("SELECT id FROM users WHERE role != 'admin' ORDER BY id");
  const userRows = users as any[];
  const userIds = userRows.map((u: any) => u.id);

  let enrollmentCount = 0;
  for (const uid of userIds) {
    const numEnrollments = randomInt(1, 5);
    const shuffled = [...courseRows].sort(() => Math.random() - 0.5).slice(0, numEnrollments);
    for (const course of shuffled) {
      const progress = randomInt(10, 100);
      const completed = progress >= 90;
      const [priceRows] = await conn.execute("SELECT price FROM courses WHERE id = ?", [course.id]);
      const coursePrice = (priceRows as any[])[0]?.price ?? 120000;
      await conn.execute(
        `INSERT INTO enrollments (user_id, course_id, progress, total_time_spent, is_completed, payment_status, amount, enrolled_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE progress = VALUES(progress)`,
        [
          uid,
          course.id,
          progress,
          randomInt(30, 600),
          completed,
          pick(["paid", "paid", "paid", "pending"]),
          coursePrice,
          randomDate(90),
          completed ? randomDate(30) : null,
        ],
      );
      enrollmentCount++;
    }
  }
  console.log(`✓ Created ${enrollmentCount} enrollments`);

  // ── 4. Exercise Attempts ──
  const [exercises] = await conn.execute("SELECT id FROM exercises");
  const exerciseRows = exercises as any[];
  let attemptCount = 0;

  for (const uid of userIds) {
    const numAttempts = randomInt(3, 15);
    for (let i = 0; i < numAttempts; i++) {
      const ex = pick(exerciseRows);
      const correct = Math.random() > 0.35;
      await conn.execute(
        `INSERT INTO exercise_attempts (user_id, exercise_id, is_correct, points_earned, time_spent, attempted_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uid, ex.id, correct, correct ? randomInt(5, 20) : 0, randomInt(10, 180), randomDate(30)],
      );
      attemptCount++;
    }
  }
  console.log(`✓ Created ${attemptCount} exercise attempts`);

  // ── 5. Leaderboard Entries ──
  for (const uid of userIds) {
    const [attempts] = await conn.execute(
      "SELECT COUNT(*) as total, SUM(points_earned) as points, SUM(is_correct) as correct FROM exercise_attempts WHERE user_id = ?",
      [uid],
    );
    const stats = (attempts as any[])[0];
    const totalPoints = Number(stats.points) || randomInt(50, 500);
    const exercisesCompleted = Number(stats.total) || randomInt(5, 30);

    for (const period of ["weekly", "monthly", "allTime"] as const) {
      await conn.execute(
        `INSERT INTO leaderboard_entries (user_id, user_name, total_points, exercises_completed, correct_answers, study_hours, current_streak, best_streak, period, \`rank\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE total_points = VALUES(total_points)`,
        [
          uid,
          `User ${uid}`,
          totalPoints,
          exercisesCompleted,
          Number(stats.correct) || randomInt(3, 25),
          (totalPoints / 60).toFixed(2),
          randomInt(1, 14),
          randomInt(5, 30),
          period,
          0,
        ],
      );
    }
  }
  console.log(`✓ Created leaderboard entries for ${userIds.length} users`);

  // ── 6. Reviews ──
  let reviewCount = 0;
  for (const uid of userIds) {
    const [userEnrollments] = await conn.execute(
      "SELECT course_id FROM enrollments WHERE user_id = ? AND is_completed = 1",
      [uid],
    );
    const completedCourses = (userEnrollments as any[]).slice(0, 3);
    for (const ce of completedCourses) {
      const rating = randomInt(3, 5);
      const comments = [
        "Excellent course! Very well structured and easy to follow.",
        "Great content, learned a lot. The instructor was very helpful.",
        "Good course overall. Could use more practical exercises.",
        "Amazing learning experience. Highly recommended!",
        "Very comprehensive and well-paced. I feel confident now.",
      ];
      await conn.execute(
        `INSERT INTO reviews (user_id, course_id, rating, comment, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
        [uid, ce.course_id, rating, pick(comments), randomDate(30)],
      );
      reviewCount++;
    }
  }
  console.log(`✓ Created ${reviewCount} reviews`);

  // ── 7. Payments ──
  let paymentCount = 0;
  for (const uid of userIds) {
    const [paidEnrollments] = await conn.execute(
      "SELECT course_id, amount FROM enrollments WHERE user_id = ? AND payment_status = 'paid'",
      [uid],
    );
    const paidCourses = paidEnrollments as any[];
    for (const pe of paidCourses.slice(0, 3)) {
      const amount = Math.round(parseFloat(pe.amount || "120000"));
      await conn.execute(
        `INSERT INTO payments (user_id, course_id, amount, currency, status, created_at)
         VALUES (?, ?, ?, 'rwf', 'completed', ?)`,
        [uid, pe.course_id, amount, randomDate(60)],
      );
      paymentCount++;
    }
  }
  console.log(`✓ Created ${paymentCount} payments`);

  // ── 8. Certificates for completed courses ──
  let certCount = 0;
  const [completedEnrollments] = await conn.execute(
    "SELECT user_id, course_id FROM enrollments WHERE is_completed = 1",
  );
  const completedList = completedEnrollments as any[];
  for (const ce of completedList) {
    const num = `PI-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await conn.execute(
      `INSERT INTO certificates (user_id, course_id, certificate_number, issued_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE certificate_number = certificate_number`,
      [ce.user_id, ce.course_id, num, randomDate(30)],
    );
    certCount++;
  }
  console.log(`✓ Created ${certCount} certificates`);

  console.log("\n✅ Seed complete!");
  await conn.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
