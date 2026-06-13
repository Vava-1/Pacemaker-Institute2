import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { createPool, getDb } from "../api/queries/connection";
import {
  categories, courses, modules, lessons, lessonProgress, badges, users, enrollments, notifications, blogPosts, messages, chatRooms,
} from "./schema";

const SEED_CONFIG = {
  admin: { email: "admin@pacemaker.institute", password: "Admin123!" },
  instructor: { email: "instructor@pacemaker.institute", password: "Instructor123!" },
  student: { email: "student@pacemaker.institute", password: "Student123!" },
};

const CATEGORIES: { name: string; slug: string; description: string; icon: string; color: string; order: number; parentSlug?: string }[] = [
  { name: "Languages", slug: "languages", description: "Master global languages including English, French, Kiswahili, and German", icon: "Languages", color: "#3b82f6", order: 1 },
  { name: "English", slug: "english", description: "Learn English from beginner to advanced", icon: "BookOpen", color: "#2563eb", order: 1, parentSlug: "languages" },
  { name: "French", slug: "french", description: "Learn French for communication and exams", icon: "BookOpen", color: "#6366f1", order: 2, parentSlug: "languages" },
  { name: "Kiswahili", slug: "kiswahili", description: "Learn Kiswahili for regional and global communication", icon: "BookOpen", color: "#8b5cf6", order: 3, parentSlug: "languages" },
  { name: "German", slug: "german", description: "Learn German for study, work, and travel", icon: "BookOpen", color: "#a855f7", order: 4, parentSlug: "languages" },
  { name: "Language Proficiency Test Preparation", slug: "language-proficiency", description: "Prepare for international language exams and certifications", icon: "Award", color: "#d946ef", order: 5, parentSlug: "languages" },
  { name: "English Test Prep Mentorship", slug: "test-prep-english", description: "Personal mentorship for English proficiency exams (TOEFL, IELTS, DUOLINGO, SAT, Cambridge)", icon: "BookOpen", color: "#2563eb", order: 1, parentSlug: "language-proficiency" },
  { name: "French Test Prep Mentorship", slug: "test-prep-french", description: "Personal mentorship for French proficiency exams (DELF, DALF, TEF, TCF Canada, TCF Québec)", icon: "BookOpen", color: "#6366f1", order: 2, parentSlug: "language-proficiency" },
  { name: "German Test Prep Mentorship", slug: "test-prep-german", description: "Personal mentorship for German proficiency exams (Goethe, TestDaF, TELC)", icon: "BookOpen", color: "#a855f7", order: 3, parentSlug: "language-proficiency" },
  { name: "Bakery", slug: "bakery", description: "Turn your passion into profit with baking skills", icon: "Cake", color: "#f97316", order: 2 },
  { name: "Salon", slug: "salon", description: "Become a professional in hair, beauty, and personal care", icon: "Scissors", color: "#ec4899", order: 3 },
  { name: "Mechanics", slug: "mechanics", description: "Gain hands-on mechanical skills to build, repair, and innovate", icon: "Wrench", color: "#64748b", order: 4 },
  { name: "AI Skills for Professionals", slug: "ai-skills", description: "Stay ahead with AI tools to boost productivity and career", icon: "Brain", color: "#8b5cf6", order: 5 },
  { name: "Private Candidate Support", slug: "private-candidates", description: "Prepare for exams with structured lessons and guidance", icon: "Award", color: "#e11d48", order: 6 },
];

const RWF_PRICES: Record<string, { price: string; original: string }> = {
  beginner_language:  { price: "120000", original: "150000" },
  intermediate_language: { price: "150000", original: "180000" },
  advanced_language:  { price: "200000", original: "250000" },
  bakery:   { price: "250000", original: "300000" },
  salon:    { price: "200000", original: "250000" },
  mechanics: { price: "180000", original: "220000" },
  ai_skills: { price: "150000", original: "180000" },
  exam_prep: { price: "200000", original: "250000" },
  test_prep_english: { price: "150000", original: "180000" },
  test_prep_french:  { price: "150000", original: "180000" },
  test_prep_german:  { price: "150000", original: "180000" },
};

const COURSES: {
  title: string; slug: string; description: string; shortDescription: string;
  price: string; originalPrice: string; currency: string;
  categorySlug: string; level: string; lessons: { title: string; type: string; duration: number; content: string }[];
}[] = [
  {
    title: "English for Beginners",
    slug: "english-beginners",
    description: "Start your English learning journey from zero. Master greetings, daily conversations, grammar basics, and build confidence in speaking.",
    shortDescription: "Learn English from scratch with practical conversations",
    price: RWF_PRICES.beginner_language.price,
    originalPrice: RWF_PRICES.beginner_language.original,
    currency: "rwf",
    categorySlug: "english",
    level: "beginner",
    lessons: [
      { title: "Greetings & Introductions", type: "video", duration: 20, content: "Learn how to greet people and introduce yourself." },
      { title: "Daily Conversations", type: "video", duration: 25, content: "Practice everyday conversations for real-life situations." },
      { title: "Grammar Basics", type: "text", duration: 30, content: "Understand basic English grammar rules." },
      { title: "English Quiz", type: "quiz", duration: 15, content: "Test your English fundamentals." },
    ],
  },
  {
    title: "Intermediate English",
    slug: "intermediate-english",
    description: "Build on your English foundation. Master complex grammar, expand vocabulary, and improve reading and writing skills for professional settings.",
    shortDescription: "Advance your English for work and study",
    price: RWF_PRICES.intermediate_language.price,
    originalPrice: RWF_PRICES.intermediate_language.original,
    currency: "rwf",
    categorySlug: "english",
    level: "intermediate",
    lessons: [
      { title: "Advanced Grammar", type: "video", duration: 30, content: "Master complex tenses, conditionals, and passive voice." },
      { title: "Business English", type: "video", duration: 35, content: "Professional communication for meetings and emails." },
      { title: "Essay Writing", type: "text", duration: 30, content: "Structure and write compelling essays and reports." },
      { title: "English Reading Comprehension", type: "quiz", duration: 20, content: "Test your reading and comprehension skills." },
    ],
  },
  {
    title: "Advanced English Mastery",
    slug: "advanced-english",
    description: "Achieve fluency in English. Focus on academic writing, advanced speaking, presentations, and nuanced communication for native-level proficiency.",
    shortDescription: "Achieve native-level English fluency",
    price: RWF_PRICES.advanced_language.price,
    originalPrice: RWF_PRICES.advanced_language.original,
    currency: "rwf",
    categorySlug: "english",
    level: "advanced",
    lessons: [
      { title: "Academic Writing", type: "video", duration: 40, content: "Research papers, citations, and formal writing." },
      { title: "Public Speaking", type: "video", duration: 35, content: "Deliver powerful presentations and speeches in English." },
      { title: "Idioms & Nuance", type: "text", duration: 25, content: "Master idiomatic expressions and cultural nuances." },
      { title: "Advanced English Assessment", type: "quiz", duration: 30, content: "Comprehensive test of advanced English skills." },
    ],
  },
  {
    title: "French for Communication",
    slug: "french-communication",
    description: "Learn French for everyday communication. Focus on speaking, listening, and building confidence in real-world situations.",
    shortDescription: "Speak French with confidence in daily life",
    price: RWF_PRICES.beginner_language.price,
    originalPrice: RWF_PRICES.beginner_language.original,
    currency: "rwf",
    categorySlug: "french",
    level: "beginner",
    lessons: [
      { title: "French Pronunciation", type: "video", duration: 25, content: "Master French sounds and pronunciation." },
      { title: "Essential Vocabulary", type: "video", duration: 30, content: "Learn key words and phrases for daily use." },
      { title: "Building Sentences", type: "text", duration: 20, content: "Construct simple to complex sentences in French." },
      { title: "French Quiz", type: "quiz", duration: 15, content: "Test your French communication skills." },
    ],
  },
  {
    title: "Intermediate French",
    slug: "intermediate-french",
    description: "Deepen your French knowledge. Master past tenses, subjunctive mood, and conversational fluency for real-life interactions.",
    shortDescription: "Take your French to the next level",
    price: RWF_PRICES.intermediate_language.price,
    originalPrice: RWF_PRICES.intermediate_language.original,
    currency: "rwf",
    categorySlug: "french",
    level: "intermediate",
    lessons: [
      { title: "Past Tenses & Subjunctive", type: "video", duration: 35, content: "Master passé composé, imparfait, and subjunctive." },
      { title: "Conversational French", type: "video", duration: 30, content: "Practice real-life dialogues and expressions." },
      { title: "French Culture & Etiquette", type: "text", duration: 20, content: "Understand cultural context for better communication." },
      { title: "French Grammar Quiz", type: "quiz", duration: 15, content: "Test your intermediate grammar knowledge." },
    ],
  },
  {
    title: "Advanced French Fluency",
    slug: "advanced-french",
    description: "Achieve advanced French proficiency. Focus on literary analysis, professional writing, and nuanced expression.",
    shortDescription: "Master French at an advanced level",
    price: RWF_PRICES.advanced_language.price,
    originalPrice: RWF_PRICES.advanced_language.original,
    currency: "rwf",
    categorySlug: "french",
    level: "advanced",
    lessons: [
      { title: "Literary French", type: "video", duration: 40, content: "Analyze French literature and poetry." },
      { title: "Professional French", type: "video", duration: 35, content: "Business correspondence and formal presentations." },
      { title: "Advanced Writing", type: "text", duration: 30, content: "Write persuasive essays and reports in French." },
      { title: "Advanced French Test", type: "quiz", duration: 25, content: "Comprehensive advanced French assessment." },
    ],
  },
  {
    title: "Kiswahili for Beginners",
    slug: "kiswahili-beginners",
    description: "Start speaking Kiswahili from day one. Learn greetings, basic vocabulary, and everyday phrases used across East Africa.",
    shortDescription: "Learn Kiswahili from scratch",
    price: RWF_PRICES.beginner_language.price,
    originalPrice: RWF_PRICES.beginner_language.original,
    currency: "rwf",
    categorySlug: "kiswahili",
    level: "beginner",
    lessons: [
      { title: "Kiswahili Greetings", type: "video", duration: 20, content: "Master common greetings and introductions." },
      { title: "Basic Vocabulary", type: "video", duration: 25, content: "Learn essential words for daily life." },
      { title: "Sentence Structure", type: "text", duration: 20, content: "Understand Kiswahili noun classes and sentence construction." },
      { title: "Kiswahili Quiz", type: "quiz", duration: 15, content: "Test your basic Kiswahili skills." },
    ],
  },
  {
    title: "Intermediate Kiswahili",
    slug: "intermediate-kiswahili",
    description: "Build fluency in Kiswahili. Master verb conjugations, storytelling, and deeper conversational skills.",
    shortDescription: "Advance your Kiswahili communication",
    price: RWF_PRICES.intermediate_language.price,
    originalPrice: RWF_PRICES.intermediate_language.original,
    currency: "rwf",
    categorySlug: "kiswahili",
    level: "intermediate",
    lessons: [
      { title: "Verb Tenses", type: "video", duration: 30, content: "Master present, past, and future tenses in Kiswahili." },
      { title: "Storytelling & Narration", type: "video", duration: 25, content: "Tell stories and describe events in Kiswahili." },
      { title: "Kiswahili in Media", type: "text", duration: 20, content: "Understand news, songs, and radio in Kiswahili." },
      { title: "Intermediate Quiz", type: "quiz", duration: 15, content: "Test your intermediate Kiswahili." },
    ],
  },
  {
    title: "Advanced Kiswahili",
    slug: "advanced-kiswahili",
    description: "Achieve advanced proficiency in Kiswahili. Focus on academic writing, professional communication, and literary analysis.",
    shortDescription: "Master advanced Kiswahili",
    price: RWF_PRICES.advanced_language.price,
    originalPrice: RWF_PRICES.advanced_language.original,
    currency: "rwf",
    categorySlug: "kiswahili",
    level: "advanced",
    lessons: [
      { title: "Academic Kiswahili", type: "video", duration: 35, content: "Write essays and academic papers in Kiswahili." },
      { title: "Professional Communication", type: "video", duration: 30, content: "Business Kiswahili for the workplace." },
      { title: "Kiswahili Literature", type: "text", duration: 25, content: "Analyze Kiswahili poetry and prose." },
      { title: "Advanced Assessment", type: "quiz", duration: 20, content: "Comprehensive advanced Kiswahili test." },
    ],
  },
  {
    title: "German for Beginners",
    slug: "german-beginners",
    description: "Start learning German. Master the alphabet, basic grammar, and essential phrases for travel, work, and daily life.",
    shortDescription: "Learn German from the ground up",
    price: RWF_PRICES.beginner_language.price,
    originalPrice: RWF_PRICES.beginner_language.original,
    currency: "rwf",
    categorySlug: "german",
    level: "beginner",
    lessons: [
      { title: "German Alphabet & Pronunciation", type: "video", duration: 25, content: "Master German sounds and the alphabet." },
      { title: "Basic Conversations", type: "video", duration: 30, content: "Essential phrases for everyday situations." },
      { title: "Grammar Foundations", type: "text", duration: 25, content: "German noun genders, cases, and basic sentence structure." },
      { title: "German Quiz", type: "quiz", duration: 15, content: "Test your basic German knowledge." },
    ],
  },
  {
    title: "Intermediate German",
    slug: "intermediate-german",
    description: "Advance your German skills. Master complex grammar, build vocabulary, and gain confidence in conversations.",
    shortDescription: "Build confidence in German",
    price: RWF_PRICES.intermediate_language.price,
    originalPrice: RWF_PRICES.intermediate_language.original,
    currency: "rwf",
    categorySlug: "german",
    level: "intermediate",
    lessons: [
      { title: "Advanced Grammar", type: "video", duration: 35, content: "Master cases, prepositions, and separable verbs." },
      { title: "Everyday Conversations", type: "video", duration: 30, content: "Navigate real-life situations in German." },
      { title: "Reading & Writing", type: "text", duration: 25, content: "Read articles and write responses in German." },
      { title: "Intermediate Test", type: "quiz", duration: 15, content: "Test your intermediate German." },
    ],
  },
  {
    title: "Advanced German",
    slug: "advanced-german",
    description: "Achieve fluency in German. Master academic writing, professional presentations, and nuanced expression.",
    shortDescription: "Achieve German fluency",
    price: RWF_PRICES.advanced_language.price,
    originalPrice: RWF_PRICES.advanced_language.original,
    currency: "rwf",
    categorySlug: "german",
    level: "advanced",
    lessons: [
      { title: "Academic German", type: "video", duration: 40, content: "Write research papers and academic texts." },
      { title: "Business German", type: "video", duration: 35, content: "Professional communication in German workplaces." },
      { title: "Literary Analysis", type: "text", duration: 30, content: "Analyze German literature and poetry." },
      { title: "Advanced Assessment", type: "quiz", duration: 25, content: "Comprehensive advanced German test." },
    ],
  },
  {
    title: "Professional Baking",
    slug: "professional-baking",
    description: "From bread to pastries, learn the art and science of professional baking. Suitable for beginners and aspiring bakers.",
    shortDescription: "Master the art of bread, cakes, and pastries",
    price: RWF_PRICES.bakery.price,
    originalPrice: RWF_PRICES.bakery.original,
    currency: "rwf",
    categorySlug: "bakery",
    level: "beginner",
    lessons: [
      { title: "Baking Fundamentals", type: "video", duration: 30, content: "Essential techniques and ingredients for baking." },
      { title: "Bread Making", type: "video", duration: 45, content: "Learn to make artisan bread from scratch." },
      { title: "Cakes & Frostings", type: "video", duration: 40, content: "Bake and decorate professional-quality cakes." },
      { title: "Baking Project", type: "text", duration: 60, content: "Create your own bakery-worthy product." },
    ],
  },
  {
    title: "Salon Hair Styling",
    slug: "salon-hair-styling",
    description: "Learn professional hair styling techniques including cutting, coloring, and styling for all hair types.",
    shortDescription: "Become a professional hair stylist",
    price: RWF_PRICES.salon.price,
    originalPrice: RWF_PRICES.salon.original,
    currency: "rwf",
    categorySlug: "salon",
    level: "beginner",
    lessons: [
      { title: "Hair Basics & Hygiene", type: "video", duration: 20, content: "Understanding hair types and salon hygiene." },
      { title: "Cutting Techniques", type: "video", duration: 40, content: "Master basic and advanced hair cutting." },
      { title: "Coloring & Treatments", type: "video", duration: 35, content: "Learn hair coloring and treatment applications." },
      { title: "Salon Practice", type: "text", duration: 45, content: "Practice a complete salon service." },
    ],
  },
  {
    title: "Automotive Mechanics",
    slug: "automotive-mechanics",
    description: "Master the fundamentals of automotive mechanics including engine repair, maintenance, and diagnostics.",
    shortDescription: "Learn to repair and maintain vehicles",
    price: RWF_PRICES.mechanics.price,
    originalPrice: RWF_PRICES.mechanics.original,
    currency: "rwf",
    categorySlug: "mechanics",
    level: "beginner",
    lessons: [
      { title: "Engine Basics", type: "video", duration: 35, content: "Understand how internal combustion engines work." },
      { title: "Brake Systems", type: "video", duration: 30, content: "Learn to inspect and repair brake systems." },
      { title: "Electrical Systems", type: "text", duration: 25, content: "Basic automotive electrical diagnostics." },
      { title: "Mechanics Quiz", type: "quiz", duration: 15, content: "Test your mechanical knowledge." },
    ],
  },
  {
    title: "AI Tools for Professionals",
    slug: "ai-tools-professionals",
    description: "Learn to use AI tools like ChatGPT, Claude, and other AI platforms to boost workplace productivity and career growth.",
    shortDescription: "Boost your career with practical AI skills",
    price: RWF_PRICES.ai_skills.price,
    originalPrice: RWF_PRICES.ai_skills.original,
    currency: "rwf",
    categorySlug: "ai-skills",
    level: "beginner",
    lessons: [
      { title: "Introduction to AI", type: "video", duration: 25, content: "What is AI and how it's changing the workplace." },
      { title: "Prompt Engineering", type: "video", duration: 35, content: "Master the art of writing effective AI prompts." },
      { title: "AI for Productivity", type: "text", duration: 30, content: "Use AI to automate tasks and boost efficiency." },
      { title: "AI Ethics & Best Practices", type: "text", duration: 20, content: "Understand responsible AI usage." },
    ],
  },
  {
    title: "Exam Preparation Support",
    slug: "exam-preparation-support",
    description: "Structured support for national and international exam preparation including study strategies, practice tests, and personalized guidance.",
    shortDescription: "Prepare confidently for your exams",
    price: RWF_PRICES.exam_prep.price,
    originalPrice: RWF_PRICES.exam_prep.original,
    currency: "rwf",
    categorySlug: "private-candidates",
    level: "all_levels",
    lessons: [
      { title: "Study Strategies", type: "video", duration: 25, content: "Effective study techniques for exam success." },
      { title: "Practice Tests", type: "quiz", duration: 45, content: "Simulated exam questions with detailed feedback." },
      { title: "Time Management", type: "text", duration: 20, content: "Master exam time management strategies." },
      { title: "Final Review", type: "text", duration: 30, content: "Comprehensive review of key exam topics." },
    ],
  },
  {
    title: "English Test Prep Mentorship",
    slug: "english-test-prep",
    description: "Personal mentorship for English proficiency exams including TOEFL, IELTS, DUOLINGO, SAT, and Cambridge certifications.",
    shortDescription: "Ace your English proficiency exams",
    price: RWF_PRICES.test_prep_english.price,
    originalPrice: RWF_PRICES.test_prep_english.original,
    currency: "rwf",
    categorySlug: "test-prep-english",
    level: "all_levels",
    lessons: [
      { title: "Reading & Comprehension", type: "video", duration: 30, content: "Master reading strategies for TOEFL, IELTS, and SAT." },
      { title: "Writing & Essays", type: "video", duration: 35, content: "Structure and write high-scoring essays." },
      { title: "Listening & Speaking", type: "video", duration: 30, content: "Improve listening and speaking skills for exams." },
      { title: "Mock Test & Review", type: "quiz", duration: 45, content: "Full-length practice test with detailed feedback." },
    ],
  },
  {
    title: "French Test Prep Mentorship",
    slug: "french-test-prep",
    description: "Personal mentorship for French proficiency exams including DELF, DALF, TEF, TCF Canada, and TCF Québec.",
    shortDescription: "Excel in French language exams",
    price: RWF_PRICES.test_prep_french.price,
    originalPrice: RWF_PRICES.test_prep_french.original,
    currency: "rwf",
    categorySlug: "test-prep-french",
    level: "all_levels",
    lessons: [
      { title: "Compréhension Écrite", type: "video", duration: 30, content: "Strategies pour comprendre des textes en français." },
      { title: "Production Écrite", type: "video", duration: 35, content: "Rédigez des essais et des lettres formelles." },
      { title: "Compréhension Orale", type: "video", duration: 30, content: "Améliorez votre écoute pour les examens." },
      { title: "Test Blanc", type: "quiz", duration: 45, content: "Examen blanc complet avec correction détaillée." },
    ],
  },
  {
    title: "German Test Prep Mentorship",
    slug: "german-test-prep",
    description: "Personal mentorship for German proficiency exams including Goethe-Zertifikat, TestDaF, and TELC certifications.",
    shortDescription: "Master German proficiency exams",
    price: RWF_PRICES.test_prep_german.price,
    originalPrice: RWF_PRICES.test_prep_german.original,
    currency: "rwf",
    categorySlug: "test-prep-german",
    level: "all_levels",
    lessons: [
      { title: "Leseverstehen", type: "video", duration: 30, content: "Lesestrategien für Goethe und TestDaF." },
      { title: "Schriftlicher Ausdruck", type: "video", duration: 35, content: "Aufsätze und formelle Briefe schreiben." },
      { title: "Hörverstehen", type: "video", duration: 30, content: "Hörverständnis für Prüfungen verbessern." },
      { title: "Musterprüfung", type: "quiz", duration: 45, content: "Komplette Übungsprüfung mit Feedback." },
    ],
  },
];

// slug → category name for thumbnail lookup
const SLUG_TO_CATEGORY: Record<string, string> = {
  english: "English",
  french: "French",
  kiswahili: "Kiswahili",
  german: "German",
  bakery: "Bakery",
  salon: "Salon",
  mechanics: "Mechanics",
  "ai-skills": "AI Skills for Professionals",
  "private-candidates": "Private Candidate Support",
  "language-proficiency": "English",
  "test-prep-english": "English",
  "test-prep-french": "French",
  "test-prep-german": "German",
};

const UNSPLASH_THUMBNAILS: Record<string, string[]> = {
  English: [
    "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
  ],
  French: [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
  ],
  Kiswahili: [
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
  ],
  German: [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800",
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

const BLOG_POSTS: {
  title: string; slug: string; excerpt: string; content: string;
  image: string; authorName: string; authorAvatar: string;
  tags: string[]; published: boolean; featured: boolean; language: string;
}[] = [
  // Kinyarwanda (rw)
  {
    title: "Uburyo bwo kwiga neza mu ishuri rya kure",
    slug: "uburyo-bwo-kwiga-neza-mu-ishuri-rya-kure",
    excerpt: "Menya amabanga y'ukuntu wakwiga neza udafite ikibazo cyo kuba kure y'ishuri.",
    content: "Kwiga mu ishuri rya kure bisaba gahunda nziza. Urugero, ugomba gutegura gahunda ya buri munsi, gukoresha neza igihe cyawe, no gufata ibyaruhukiwe nk'ikigisho cy'ingenzi. Iyi ngingo igufasha kumenya uko wakwiga neza mu nzu yawe.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
    authorName: "Dr. Jean Pierre",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    tags: ["e-learning", "tips", "study"],
    published: true,
    featured: true,
    language: "rw",
  },
  {
    title: "Akarusho k'ubumenyi mu gihe cya digitale",
    slug: "akarusho-k-ubumenyi-mu-gihe-cya-digitale",
    excerpt: "Reeba uburyo ikoranabuhanga ryahinduye uburyo bw'imyigishirize mu Rwanda.",
    content: "Ikoranabuhanga ryahinduye cyane uburyo abanyeshuri bakura ubumenyi. Ushobora kwiga ikindi cyose ushaka ukoresheje mudasobwa yawe cyangwa terefone. Iyi ngingo ivuga ku byiza byo kwiga ukoresheje ikoranabuhanga.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    authorName: "Mugabo Alice",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    tags: ["technology", "education", "Rwanda"],
    published: true,
    featured: false,
    language: "rw",
  },
  {
    title: "Kwiga icyongereza mu buryo bworoshye",
    slug: "kwiga-icyongereza-mu-buryo-bworoshye",
    excerpt: "Sobanukirwa uburyo bworoshye bwo kwiga icyongereza wifashishije interineti.",
    content: "Kwiga icyongereza ntibikomeye nk'uko bibonera. Ushobora kwifashisha amakuru menshi aboneka kuri interineti, amashuri ya kure, n'ibikoresho byo kwigisha kugira ngo uteze imbere mu vugo.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    authorName: "Mukamana Béatrice",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-62b20a0f7a7a?w=200",
    tags: ["english", "language", "tips"],
    published: true,
    featured: true,
    language: "rw",
  },
  {
    title: "Gukora neza mu buzima bwawe",
    slug: "gukora-neza-mu-buzima-bwawe",
    excerpt: "Amabanga y'ukuntu wakora neza mu buzima bwawe bwa buri munsi.",
    content: "Gukora neza mu buzima bisaba gahunda nziza, kwirinda ibintu bitagira akamaro, no gukoresha igihe cyawe neza. Soma iyi ngingo kugira ngo umenye uko wakora neza.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    authorName: "Niyonzima Théogène",
    authorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    tags: ["productivity", "lifestyle", "tips"],
    published: true,
    featured: false,
    language: "rw",
  },
  // French (fr)
  {
    title: "Comment réussir ses examens en ligne",
    slug: "comment-reussir-ses-examens-en-ligne",
    excerpt: "Découvrez les meilleures stratégies pour réussir vos examens à distance.",
    content: "Les examens en ligne peuvent être stressants, mais avec une bonne préparation, vous pouvez les réussir. Dans cet article, nous partageons des conseils pratiques pour gérer votre temps, éviter les distractions et maximiser vos résultats.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
    authorName: "Prof. Marie Claire",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    tags: ["exams", "online-learning", "success"],
    published: true,
    featured: true,
    language: "fr",
  },
  {
    title: "Top 10 des compétences à apprendre en 2026",
    slug: "top-10-competences-2026",
    excerpt: "Voici les compétences les plus demandées sur le marché du travail cette année.",
    content: "Le marché du travail évolue rapidement. Découvrez les compétences les plus recherchées en 2026, y compris l'intelligence artificielle, la gestion de projet, les langues étrangères, et bien plus.",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
    authorName: "Habimana David",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    tags: ["career", "skills", "2026"],
    published: true,
    featured: false,
    language: "fr",
  },
  {
    title: "Apprendre une langue avec Pacemaker",
    slug: "apprendre-une-langue-avec-pacemaker",
    excerpt: "Découvrez comment notre plateforme vous aide à maîtriser une nouvelle langue rapidement.",
    content: "Chez Pacemaker Institute, nous croyons que l'apprentissage des langues doit être accessible à tous. Nos cours en ligne sont conçus pour vous aider à progresser à votre rythme avec des instructeurs qualifiés.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    authorName: "Prof. Marie Claire",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    tags: ["languages", "pacemaker", "learning"],
    published: true,
    featured: true,
    language: "fr",
  },
  // German (de)
  {
    title: "Die Zukunft des E-Learnings in Afrika",
    slug: "zukunft-e-learning-afrika",
    excerpt: "Wie digitale Bildung den afrikanischen Kontinent verändert.",
    content: "Afrika erlebt eine digitale Revolution im Bildungsbereich. Immer mehr afrikanische Länder setzen auf E-Learning, um Bildung für alle zugänglich zu machen. Erfahren Sie, welche Trends die Zukunft prägen werden.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
    authorName: "Prof. Dr. Schmidt",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    tags: ["e-learning", "Africa", "future"],
    published: true,
    featured: false,
    language: "de",
  },
  {
    title: "Tipps für effektives Online-Lernen",
    slug: "tipps-fuer-effektives-online-lernen",
    excerpt: "Praktische Ratschläge, um das Beste aus Ihrem Online-Studium herauszuholen.",
    content: "Online-Lernen erfordert Disziplin und die richtigen Strategien. In diesem Artikel teilen wir bewährte Methoden, um konzentriert zu bleiben, Ihre Zeit effizient zu nutzen und Ihre Lernziele zu erreichen.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
    authorName: "Prof. Dr. Schmidt",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    tags: ["online-learning", "tips", "productivity"],
    published: true,
    featured: true,
    language: "de",
  },
  {
    title: "Karrieremöglichkeiten mit Sprachkenntnissen",
    slug: "karrieremoeglichkeiten-mit-sprachkenntnissen",
    excerpt: "Wie das Erlernen einer neuen Sprache Ihre Karrierechancen verbessern kann.",
    content: "In einer globalisierten Welt sind Sprachkenntnisse ein wertvolles Gut. Arbeitgeber schätzen Kandidaten, die mehrere Sprachen sprechen. Entdecken Sie, wie eine neue Sprache Ihre beruflichen Möglichkeiten erweitern kann.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c7f9?w=800",
    authorName: "Anna Müller",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    tags: ["career", "languages", "opportunities"],
    published: true,
    featured: false,
    language: "de",
  },
  // English (en)
  {
    title: "How to Succeed in Online Learning",
    slug: "how-to-succeed-in-online-learning",
    excerpt: "Learn the best strategies to make the most of your online education experience.",
    content: "Online learning offers flexibility and access to world-class education from anywhere. To succeed, you need to create a consistent study schedule, eliminate distractions, and actively participate in course activities. This guide will help you thrive in your online learning journey.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
    authorName: "Dr. Sarah Johnson",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    tags: ["online-learning", "success", "tips"],
    published: true,
    featured: true,
    language: "en",
  },
  {
    title: "The Rise of E-Learning in Africa",
    slug: "rise-of-elearning-in-africa",
    excerpt: "How digital education is transforming learning opportunities across the African continent.",
    content: "Africa is experiencing a digital revolution in education. With increasing internet penetration and mobile device adoption, e-learning platforms are making quality education accessible to millions. This article explores the trends shaping the future of education in Africa.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
    authorName: "James Mwangi",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    tags: ["e-learning", "Africa", "education"],
    published: true,
    featured: false,
    language: "en",
  },
  {
    title: "Top Programming Languages to Learn in 2026",
    slug: "top-programming-languages-2026",
    excerpt: "Stay ahead of the curve with these in-demand programming languages.",
    content: "The tech industry continues to evolve at a rapid pace. Whether you're a beginner or an experienced developer, learning the right programming languages can open up new career opportunities. Here are the top languages to focus on this year.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
    authorName: "Dr. Sarah Johnson",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    tags: ["programming", "career", "technology"],
    published: true,
    featured: true,
    language: "en",
  },
  // Kiswahili (sw)
  {
    title: "Jinsi ya Kufaulu Katika Masomo ya Mtandaoni",
    slug: "jinsi-ya-kufaulu-masomo-mtandaoni",
    excerpt: "Jifunze mikakati bora ya kufaulu katika elimu yako ya mtandaoni.",
    content: "Masomo ya mtandaoni yanatoa kubadilika na ufikiaji wa elimu ya hali ya juu kutoka popote. Ili kufaulu, unahitaji kuunda ratiba thabiti ya kusoma, kuondoa vikengeusha, na kushiriki kikamilifu katika shughuli za kozi. Mwongozo huu utakusaidia kustawi katika safari yako ya kujifunza mtandaoni.",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
    authorName: "Dkt. Aisha Mohamed",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    tags: ["online-learning", "success", "tips"],
    published: true,
    featured: true,
    language: "sw",
  },
  {
    title: "Umuhimu wa Elimu ya Mtandaoni Afrika",
    slug: "umuhimu-wa-elimu-mtandaoni-afrika",
    excerpt: "Jinsi elimu ya dijitali inavyobadilisha fursa za kujifunza barani Afrika.",
    content: "Afrika inakabiliwa na mapinduzi ya kidijitali katika elimu. Kwa kuongezeka kwa matumizi ya mtandao na vifaa vya mkononi, majukwaa ya elimu mtandaoni yanafanya elimu bora kupatikana kwa mamilioni. Makala hii inachunguza mwelekeo unaounda mustakabali wa elimu Afrika.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    authorName: "Dkt. Aisha Mohamed",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    tags: ["e-learning", "Africa", "education"],
    published: true,
    featured: false,
    language: "sw",
  },
  {
    title: "Njia Rahisi za Kujifunza Lugha Mpya",
    slug: "njia-rahisi-kujifunza-lugha-mpya",
    excerpt: "Gundua njia rahisi na za haraka za kujifunza lugha mpya mtandaoni.",
    content: "Kujifunza lugha mpya kunaweza kuwa changamoto, lakini kwa zana sahihi na mbinu bora, unaweza kufanya maendeleo ya haraka. Pacemaker Institute inatoa kozi za lugha zinazokusaidia kujifunza kwa urahisi na kwa muda wako mwenyewe.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    authorName: "Fatima Hassan",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    tags: ["languages", "learning", "tips"],
    published: true,
    featured: false,
    language: "sw",
  },
];

const BADGES = [
  { name: "First Steps", description: "Complete your first lesson", icon: "Footprints", color: "#3b82f6", requirementType: "lessons", requirementValue: 1, points: 10 },
  { name: "Quick Learner", description: "Complete 5 lessons in a day", icon: "Zap", color: "#f97316", requirementType: "lessons", requirementValue: 5, points: 25 },
  { name: "Course Champion", description: "Complete an entire course", icon: "Trophy", color: "#f59e0b", requirementType: "courses", requirementValue: 1, points: 100 },
  { name: "Knowledge Seeker", description: "Enroll in 5 courses", icon: "BookOpen", color: "#10b981", requirementType: "courses", requirementValue: 5, points: 50 },
  { name: "Perfect Score", description: "Get 100% on any quiz", icon: "Target", color: "#ec4899", requirementType: "score", requirementValue: 100, points: 50 },
  { name: "Social Butterfly", description: "Participate in 10 forum discussions", icon: "MessageCircle", color: "#8b5cf6", requirementType: "messages", requirementValue: 10, points: 30 },
];

async function upsertUser(opts: {
  email: string;
  name: string;
  password: string;
  role: "admin" | "instructor" | "user";
  emailVerified?: boolean;
}) {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.email, opts.email)).limit(1);
  if (existing.length > 0) {
    console.log(`  - User ${opts.email} already exists, skipping.`);
    return existing[0];
  }
  const passwordHash = await bcrypt.hash(opts.password, 12);
  const [result] = await db.insert(users).values({
    email: opts.email,
    name: opts.name,
    passwordHash,
    role: opts.role,
    emailVerified: opts.emailVerified ?? true,
    emailVerifyToken: null,
  });
  const inserted = await db.select().from(users).where(eq(users.id, result.insertId)).limit(1);
  console.log(`  + Created ${opts.role}: ${opts.email}`);
  return inserted[0];
}

async function seed() {
  console.log("Checking DATABASE_URL...");
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  // Initialize database pool
  createPool();
  const db = getDb();

  console.log("\nSeeding users...");
  await upsertUser({
    email: SEED_CONFIG.admin.email,
    name: "Platform Admin",
    password: SEED_CONFIG.admin.password,
    role: "admin",
  });
  const instructor = await upsertUser({
    email: SEED_CONFIG.instructor.email,
    name: "Sample Instructor",
    password: SEED_CONFIG.instructor.password,
    role: "instructor",
  });
  const student = await upsertUser({
    email: SEED_CONFIG.student.email,
    name: "Sample Student",
    password: SEED_CONFIG.student.password,
    role: "user",
  });

  console.log("\nSeeding categories...");
  await db.delete(categories);
  const insertedSlugs = new Set<string>();
  const slugToId: Record<string, number> = {};
  const parentCategories = CATEGORIES.filter(c => !c.parentSlug);
  for (const cat of parentCategories) {
    const [result] = await db.insert(categories).values({
      name: cat.name, slug: cat.slug, description: cat.description,
      icon: cat.icon, color: cat.color, order: cat.order,
    });
    slugToId[cat.slug] = result.insertId;
    insertedSlugs.add(cat.slug);
    const childCategories = CATEGORIES.filter(c => c.parentSlug === cat.slug);
    for (const child of childCategories) {
      const [childResult] = await db.insert(categories).values({
        name: child.name, slug: child.slug, description: child.description,
        icon: child.icon, color: child.color, order: child.order,
        parentId: result.insertId,
      });
      slugToId[child.slug] = childResult.insertId;
      insertedSlugs.add(child.slug);
    }
  }
  const grandchildCategories = CATEGORIES.filter(
    c => !insertedSlugs.has(c.slug) && c.parentSlug && slugToId[c.parentSlug],
  );
  for (const child of grandchildCategories) {
    await db.insert(categories).values({
      name: child.name, slug: child.slug, description: child.description,
      icon: child.icon, color: child.color, order: child.order,
      parentId: slugToId[child.parentSlug!],
    });
  }
  console.log(`  + Created ${CATEGORIES.length} categories (including subcategories)`);

  const thumbIndex: Record<string, number> = {};

  console.log("\nSeeding courses and lessons...");
  await db.delete(lessonProgress);
  await db.delete(lessons);
  await db.delete(modules);
  await db.delete(enrollments);
  await db.delete(courses);
  for (const courseData of COURSES) {
      const cat = (await db.select().from(categories).where(eq(categories.slug, courseData.categorySlug)).limit(1))[0];
      if (!cat) {
        console.log(`  ! Category ${courseData.categorySlug} not found, skipping course`);
        continue;
      }

      const [courseResult] = await db.insert(courses).values({
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        shortDescription: courseData.shortDescription,
        categoryId: cat.id,
        instructorId: instructor.id,
        level: courseData.level as any,
        language: "en",
        thumbnail: (() => {
          const catName = SLUG_TO_CATEGORY[courseData.categorySlug] ?? "English";
          const imgs = UNSPLASH_THUMBNAILS[catName];
          thumbIndex[catName] = (thumbIndex[catName] ?? -1) + 1;
          return imgs[thumbIndex[catName] % imgs.length];
        })(),
        price: courseData.price,
        originalPrice: courseData.originalPrice,
        currency: courseData.currency,
        duration: courseData.lessons.reduce((sum, l) => sum + l.duration, 0),
        status: "published",
        isFeatured: true,
        rating: "4.5",
        totalStudents: 0,
        totalLessons: courseData.lessons.length,
        tags: [courseData.categorySlug, courseData.level],
      });

      const courseId = courseResult.insertId;

      const [modResult] = await db.insert(modules).values({
        courseId,
        title: `${courseData.title} - Course Content`,
        description: `All lessons for ${courseData.title}`,
        order: 1,
      });

      for (let i = 0; i < courseData.lessons.length; i++) {
        const lesson = courseData.lessons[i];
        await db.insert(lessons).values({
          moduleId: modResult.insertId,
          courseId,
          title: lesson.title,
          type: lesson.type as any,
          contentText: lesson.content,
          duration: lesson.duration,
          order: i + 1,
          isFree: i === 0,
        });
      }

      console.log(`  + Created course: ${courseData.title} (${courseData.lessons.length} lessons)`);
    }

  console.log("\nSeeding badges...");
  const existingBadges = await db.select().from(badges);
  if (existingBadges.length === 0) {
    await db.insert(badges).values(BADGES);
    console.log(`  + Created ${BADGES.length} badges`);
  } else {
    console.log("  - Badges already exist, skipping.");
  }

  console.log("\nSeeding sample enrollment...");
  const existingEnrollments = await db.select().from(enrollments);
  if (existingEnrollments.length === 0) {
    const firstCourse = (await db.select().from(courses).limit(1))[0];
    if (firstCourse) {
      await db.insert(enrollments).values({
        userId: student.id,
        courseId: firstCourse.id,
        progress: 15,
        paymentStatus: "paid",
      });
      console.log(`  + Enrolled student in: ${firstCourse.title}`);
    }
  } else {
    console.log("  - Enrollments already exist, skipping.");
  }

  console.log("\nSeeding notifications...");
  const existingNotifs = await db.select().from(notifications);
  if (existingNotifs.length === 0) {
    await db.insert(notifications).values([
      { userId: student.id, type: "welcome", title: "Welcome to Pacemaker Institute!", message: "Start your learning journey today.", isRead: false },
      { userId: instructor.id, type: "course_published", title: "Course Published", message: "Your course has been published successfully.", isRead: false },
    ]);
    console.log("  + Created sample notifications");
  } else {
    console.log("  - Notifications already exist, skipping.");
  }

  console.log("\nSeeding chat rooms...");
  await db.delete(messages);
  await db.delete(chatRooms);
  const CHAT_ROOMS = [
    { name: "General", slug: "general", description: "Welcome to the Pacemaker community! Chat about anything.", category: "general" },
    { name: "Languages", slug: "languages", description: "Practice languages together — English, French, German, Kiswahili & more", category: "languages" },
    { name: "Exam Prep", slug: "exam-prep", description: "TOEFL, IELTS, DELF, SAT — prep tips and study groups", category: "exam-prep" },
    { name: "Mechanics", slug: "mechanics", description: "Auto mechanics, engine diagnostics & automotive tech", category: "mechanics" },
    { name: "Bakery", slug: "bakery", description: "Sourdough, pastry, artisan bread — share recipes & tips", category: "bakery" },
    { name: "Salon & Beauty", slug: "salon", description: "Hair, makeup, nails & beauty business", category: "salon" },
    { name: "AI Skills", slug: "ai-skills", description: "AI tools, prompt engineering, and tech discussions", category: "ai-skills" },
    { name: "Instructors Lounge", slug: "instructors-lounge", description: "Private space for instructors and mentors", category: "general" },
  ];
  for (const room of CHAT_ROOMS) {
    await db.insert(chatRooms).values(room);
  }
  console.log(`  + Created ${CHAT_ROOMS.length} chat rooms`);

  console.log("\nSeeding blog posts...");
  await db.delete(blogPosts);
  for (const post of BLOG_POSTS) {
    await db.insert(blogPosts).values({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      tags: post.tags,
      language: post.language,
      published: post.published,
      featured: post.featured,
    });
  }
  console.log(`  + Created ${BLOG_POSTS.length} blog posts`);

  console.log("\n========================================");
  console.log("  SEEDING COMPLETE!");
  console.log("========================================");
  console.log("  Default Login Credentials:");
  console.log(`    Admin:      ${SEED_CONFIG.admin.email} / ${SEED_CONFIG.admin.password}`);
  console.log(`    Instructor: ${SEED_CONFIG.instructor.email} / ${SEED_CONFIG.instructor.password}`);
  console.log(`    Student:    ${SEED_CONFIG.student.email} / ${SEED_CONFIG.student.password}`);
  console.log("========================================");
  console.log("  !!! IMPORTANT: Change these passwords after first login !!!");
  console.log("========================================\n");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
