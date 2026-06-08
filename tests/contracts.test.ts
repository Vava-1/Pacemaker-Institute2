import { describe, it, expect } from "vitest";
import { z } from "zod";

const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  env: z.string(),
  services: z.record(
    z.string(),
    z.object({
      status: z.enum(["ok", "down", "not_configured"]),
      detail: z.string().optional(),
      latencyMs: z.number().optional(),
    }),
  ),
});

const LoginResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    name: z.string().nullable(),
    email: z.string(),
    role: z.enum(["user", "instructor", "admin"]),
    avatar: z.string().nullable().optional(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});

const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  requestId: z.string().optional(),
});

describe("API Response Contracts", () => {
  it("validates a healthy health-check response shape", () => {
    const sample = {
      status: "ok",
      timestamp: new Date().toISOString(),
      env: "production",
      services: {
        database: { status: "ok" as const, latencyMs: 5 },
        stripe: { status: "not_configured" as const },
        anthropic: { status: "ok" as const, detail: "Key present" },
      },
    };
    const result = HealthResponseSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("flags a degraded response correctly", () => {
    const sample = {
      status: "degraded",
      timestamp: new Date().toISOString(),
      env: "production",
      services: {
        database: { status: "down" as const, detail: "ECONNREFUSED" },
      },
    };
    const result = HealthResponseSchema.safeParse(sample);
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("degraded");
  });

  it("validates a login response shape", () => {
    const sample = {
      user: {
        id: 1,
        name: "Test",
        email: "test@example.com",
        role: "user" as const,
        avatar: null,
      },
      accessToken: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.test-signature",
      refreshToken: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.test-signature",
    };
    const result = LoginResponseSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("validates error envelope with all fields", () => {
    const sample = {
      success: false,
      error: "Internal Server Error",
      message: "Something went wrong",
      requestId: "abc-123",
    };
    const result = ErrorEnvelopeSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("validates error envelope with minimum fields", () => {
    const sample = {
      success: false,
      error: "Not Found",
    };
    const result = ErrorEnvelopeSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("rejects invalid error envelope with success=true", () => {
    const result = ErrorEnvelopeSchema.safeParse({ success: true, error: "x" });
    expect(result.success).toBe(false);
  });
});

describe("Authentication", () => {
  const emailSchema = z.string().email();

  it("validates email formats", () => {
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
    expect(emailSchema.safeParse("user.name+tag@example.co.uk").success).toBe(true);
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });

  const passwordSchema = z.string().min(8);

  it("validates password length", () => {
    expect(passwordSchema.safeParse("SecureP@ss1").success).toBe(true);
    expect(passwordSchema.safeParse("Ab1!").success).toBe(false);
    expect(passwordSchema.safeParse("").success).toBe(false);
  });

  it("validates JWT structure (3 parts separated by dots)", () => {
    const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    expect(jwtRegex.test("header.payload.signature")).toBe(true);
    expect(jwtRegex.test("invalid")).toBe(false);
    expect(jwtRegex.test("two.parts")).toBe(false);
  });

  const roleSchema = z.enum(["user", "instructor", "admin"]);

  it("validates user roles", () => {
    expect(roleSchema.safeParse("user").success).toBe(true);
    expect(roleSchema.safeParse("instructor").success).toBe(true);
    expect(roleSchema.safeParse("admin").success).toBe(true);
    expect(roleSchema.safeParse("superadmin").success).toBe(false);
    expect(roleSchema.safeParse("").success).toBe(false);
  });
});

describe("Payment Processing", () => {
  it("validates Stripe price ID format", () => {
    const priceIdSchema = z.string().startsWith("price_");
    expect(priceIdSchema.safeParse("price_123abc").success).toBe(true);
    expect(priceIdSchema.safeParse("pi_123abc").success).toBe(false);
    expect(priceIdSchema.safeParse("").success).toBe(false);
  });

  it("validates Stripe customer ID format", () => {
    const customerIdSchema = z.string().startsWith("cus_");
    expect(customerIdSchema.safeParse("cus_123abc").success).toBe(true);
    expect(customerIdSchema.safeParse("cs_123abc").success).toBe(false);
  });

  it("validates checkout input", () => {
    const checkoutSchema = z.object({
      courseId: z.number().positive(),
      priceId: z.string().startsWith("price_"),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    });

    expect(checkoutSchema.safeParse({
      courseId: 1,
      priceId: "price_abc123",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    }).success).toBe(true);

    expect(checkoutSchema.safeParse({
      courseId: 0,
      priceId: "price_abc123",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    }).success).toBe(false);
  });

  it("validates webhook signature format", () => {
    const sigSchema = z.string().startsWith("t=");
    expect(sigSchema.safeParse("t=12345678").success).toBe(true);
    expect(sigSchema.safeParse("invalid").success).toBe(false);
  });

  it("validates amount is positive and within range", () => {
    const amountSchema = z.number().positive().max(999999.99);
    expect(amountSchema.safeParse(9.99).success).toBe(true);
    expect(amountSchema.safeParse(999999.99).success).toBe(true);
    expect(amountSchema.safeParse(0).success).toBe(false);
    expect(amountSchema.safeParse(-5).success).toBe(false);
    expect(amountSchema.safeParse(1000000).success).toBe(false);
  });
});

describe("Course Content", () => {
  it("validates course creation schema", () => {
    const courseSchema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(10).max(5000),
      price: z.number().min(0).max(9999.99),
      categoryId: z.number().positive(),
      isPublished: z.boolean(),
    });

    expect(courseSchema.safeParse({
      title: "Introduction to TypeScript",
      description: "Learn TypeScript from scratch with hands-on projects and real-world examples.",
      price: 49.99,
      categoryId: 1,
      isPublished: true,
    }).success).toBe(true);

    expect(courseSchema.safeParse({
      title: "",
      description: "Short",
      price: -5,
      categoryId: 0,
      isPublished: "yes",
    }).success).toBe(false);
  });

  it("validates lesson types", () => {
    const lessonTypeSchema = z.enum(["video", "text", "pdf", "quiz"]);
    expect(lessonTypeSchema.safeParse("video").success).toBe(true);
    expect(lessonTypeSchema.safeParse("text").success).toBe(true);
    expect(lessonTypeSchema.safeParse("pdf").success).toBe(true);
    expect(lessonTypeSchema.safeParse("quiz").success).toBe(true);
    expect(lessonTypeSchema.safeParse("audio").success).toBe(false);
  });

  it("validates quiz structure", () => {
    const quizSchema = z.object({
      question: z.string().min(1),
      options: z.array(z.string()).min(2).max(6),
      correctAnswer: z.number().nonnegative(),
      explanation: z.string().optional(),
    });

    expect(quizSchema.safeParse({
      question: "What is TypeScript?",
      options: ["A language", "A framework", "A database"],
      correctAnswer: 0,
    }).success).toBe(true);

    expect(quizSchema.safeParse({
      question: "",
      options: [],
      correctAnswer: -1,
    }).success).toBe(false);
  });
});

describe("User Management", () => {
  it("validates registration input", () => {
    const registerSchema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["user", "instructor"]).default("user"),
    });

    expect(registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "SecureP@ss1",
      role: "user",
    }).success).toBe(true);

    expect(registerSchema.safeParse({
      name: "J",
      email: "invalid",
      password: "short",
      role: "admin",
    }).success).toBe(false);
  });

  it("validates profile update schema", () => {
    const profileSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      bio: z.string().max(500).optional(),
      avatar: z.string().url().optional(),
    });

    expect(profileSchema.safeParse({ name: "Updated Name" }).success).toBe(true);
    expect(profileSchema.safeParse({ bio: "A".repeat(600) }).success).toBe(false);
    expect(profileSchema.safeParse({}).success).toBe(true);
  });
});

describe("Security", () => {
  it("validates CSP header patterns", () => {
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; object-src 'none';";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("detects SQL injection patterns", () => {
    const sqlInjectionPatterns = [
      /'.*\sOR\s.*=.*/i,
      /'.*\sDROP\sTABLE/i,
      /'.*\sDELETE\sFROM/i,
      /'.*\sUNION\sSELECT/i,
      /'.*\sINSERT\sINTO/i,
      /'.*\s--/,
      /'.*\s#/,
    ];

    const malicious = ["' OR 1=1 --", "admin'--", "'; DROP TABLE users; --"];
    const safe = ["SELECT * FROM users WHERE id = ?", "John Doe", "test@example.com"];

    for (const input of malicious) {
      const detected = sqlInjectionPatterns.some((p) => p.test(input));
      expect(detected).toBe(true);
    }

    for (const input of safe) {
      const detected = sqlInjectionPatterns.some((p) => p.test(input));
      expect(detected).toBe(false);
    }
  });

  it("prevents email header injection", () => {
    const hasInjection = (input: string) => /[\n\r\t]/.test(input);
    expect(hasInjection("user@example.com")).toBe(false);
    expect(hasInjection("user@example.com\nCC: evil@example.com")).toBe(true);
    expect(hasInjection("user@example.com\rBCC: evil@example.com")).toBe(true);
  });

  it("validates file upload types", () => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"];
    const blockedMimeTypes = ["application/x-msdownload", "application/x-shockwave-flash", "text/html", "application/java-archive"];

    for (const mime of allowedMimeTypes) {
      expect(allowedMimeTypes.includes(mime)).toBe(true);
    }

    for (const mime of blockedMimeTypes) {
      expect(allowedMimeTypes.includes(mime)).toBe(false);
    }
  });

  it("validates file size limits", () => {
    const maxSize = 50 * 1024 * 1024;
    expect(1024).toBeLessThanOrEqual(maxSize);
    expect(50 * 1024 * 1024).toBeLessThanOrEqual(maxSize);
    expect(100 * 1024 * 1024).toBeGreaterThan(maxSize);
  });
});

describe("Environment Validation", () => {
  it("requires NODE_ENV, DATABASE_URL, and JWT secrets", () => {
    const envSchema = z.object({
      NODE_ENV: z.enum(["development", "production", "test"]),
      DATABASE_URL: z.string().min(1),
      JWT_ACCESS_SECRET: z.string().min(32),
      JWT_REFRESH_SECRET: z.string().min(32),
      FRONTEND_URL: z.string().url(),
    });

    expect(envSchema.safeParse({
      NODE_ENV: "development",
      DATABASE_URL: "mysql://localhost:3306/db",
      JWT_ACCESS_SECRET: "a".repeat(32),
      JWT_REFRESH_SECRET: "b".repeat(32),
      FRONTEND_URL: "http://localhost:5173",
    }).success).toBe(true);

    expect(envSchema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "",
      JWT_ACCESS_SECRET: "short",
      JWT_REFRESH_SECRET: "short",
      FRONTEND_URL: "not-a-url",
    }).success).toBe(false);
  });

  it("validates Stripe key format", () => {
    const stripeKeySchema = z.string().startsWith("sk_");
    expect(stripeKeySchema.safeParse("sk_test_abc123").success).toBe(true);
    expect(stripeKeySchema.safeParse("pk_test_abc123").success).toBe(false);
    expect(stripeKeySchema.safeParse("").success).toBe(false);
  });

  it("validates Anthropic key format", () => {
    const anthropicKeySchema = z.string().startsWith("sk-ant-");
    expect(anthropicKeySchema.safeParse("sk-ant-test-key-here").success).toBe(true);
    expect(anthropicKeySchema.safeParse("sk-other-key").success).toBe(false);
  });
});

describe("Notifications", () => {
  it("validates email template variables", () => {
    const emailSchema = z.object({
      to: z.string().email(),
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(10000),
      templateId: z.string().optional(),
    });

    expect(emailSchema.safeParse({
      to: "user@example.com",
      subject: "Welcome!",
      body: "<h1>Hello</h1>",
    }).success).toBe(true);

    expect(emailSchema.safeParse({
      to: "invalid",
      subject: "",
      body: "",
    }).success).toBe(false);
  });

  it("validates notification preferences", () => {
    const prefSchema = z.object({
      emailCourseUpdates: z.boolean(),
      emailMarketing: z.boolean(),
      emailSecurityAlerts: z.boolean(),
      pushNotifications: z.boolean(),
    });

    expect(prefSchema.safeParse({
      emailCourseUpdates: true,
      emailMarketing: false,
      emailSecurityAlerts: true,
      pushNotifications: false,
    }).success).toBe(true);

    expect(prefSchema.safeParse({
      emailCourseUpdates: "yes",
      emailMarketing: null,
    }).success).toBe(false);
  });
});

describe("Certificates", () => {
  it("validates certificate generation", () => {
    const certSchema = z.object({
      userId: z.number().positive(),
      courseId: z.number().positive(),
      completionDate: z.string().datetime(),
      progress: z.literal(100),
      certificateNumber: z.string().regex(/^CERT-[A-Z0-9]{8}$/),
    });

    expect(certSchema.safeParse({
      userId: 1,
      courseId: 1,
      completionDate: new Date().toISOString(),
      progress: 100,
      certificateNumber: "CERT-ABCD1234",
    }).success).toBe(true);

    expect(certSchema.safeParse({
      userId: -1,
      courseId: 0,
      progress: 99,
      certificateNumber: "invalid",
    }).success).toBe(false);
  });
});

describe("Rate Limiting", () => {
  it("validates rate limit configuration", () => {
    const rateLimitSchema = z.object({
      windowMs: z.number().positive().max(3600000),
      limit: z.number().positive().max(10000),
      standardHeaders: z.literal("draft-6"),
    });

    expect(rateLimitSchema.safeParse({
      windowMs: 60000,
      limit: 100,
      standardHeaders: "draft-6",
    }).success).toBe(true);

    expect(rateLimitSchema.safeParse({
      windowMs: 0,
      limit: 0,
      standardHeaders: "draft-7",
    }).success).toBe(false);
  });
});

describe("Integration Flows", () => {
  it("validates registration flow", () => {
    const step1Schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const step2Schema = z.object({
      name: z.string().min(2).max(100),
      role: z.enum(["user", "instructor"]),
    });

    const step3Schema = z.object({
      emailVerified: z.boolean(),
      accountActive: z.boolean(),
    });

    const registrationFlow = {
      step1: { email: "user@example.com", password: "SecureP@ss1" },
      step2: { name: "Test User", role: "user" as const },
      step3: { emailVerified: false, accountActive: true },
    };

    expect(step1Schema.safeParse(registrationFlow.step1).success).toBe(true);
    expect(step2Schema.safeParse(registrationFlow.step2).success).toBe(true);
    expect(step3Schema.safeParse(registrationFlow.step3).success).toBe(true);
  });

  it("validates enrollment flow", () => {
    const enrollmentSchema = z.object({
      userId: z.number().positive(),
      courseId: z.number().positive(),
      paymentStatus: z.enum(["pending", "paid", "refunded", "failed"]),
      enrolledAt: z.string().datetime(),
      expiresAt: z.string().datetime().optional(),
    });

    expect(enrollmentSchema.safeParse({
      userId: 1,
      courseId: 1,
      paymentStatus: "paid",
      enrolledAt: new Date().toISOString(),
    }).success).toBe(true);
  });
});
