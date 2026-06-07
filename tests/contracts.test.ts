import { describe, it, expect } from "vitest";
import { z } from "zod";

const HealthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    status: z.enum(["ok", "degraded"]),
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
  }),
});

const LoginResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    name: z.string().nullable(),
    email: z.string(),
    role: z.enum(["user", "instructor", "admin"]),
    avatar: z.string().nullable().optional(),
  }),
});

describe("API response contracts", () => {
  it("validates a healthy health-check response shape", () => {
    const sample = {
      success: true,
      data: {
        status: "ok" as const,
        timestamp: new Date().toISOString(),
        env: "production",
        services: {
          database: { status: "ok" as const, latencyMs: 5 },
          stripe: { status: "not_configured" as const },
          anthropic: { status: "ok" as const, detail: "Key present" },
        },
      },
    };
    const result = HealthResponseSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("flags a degraded response correctly", () => {
    const sample = {
      success: true,
      data: {
        status: "degraded" as const,
        timestamp: new Date().toISOString(),
        env: "production",
        services: {
          database: { status: "down" as const, detail: "ECONNREFUSED" },
        },
      },
    };
    const result = HealthResponseSchema.safeParse(sample);
    expect(result.success).toBe(true);
    expect(result.data?.data.status).toBe("degraded");
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
    };
    const result = LoginResponseSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });
});

describe("error envelope contract", () => {
  const ErrorEnvelope = z.object({
    success: z.literal(false),
    error: z.string(),
  });

  it("requires success=false and an error string", () => {
    expect(ErrorEnvelope.safeParse({ success: false, error: "Nope" }).success).toBe(true);
    expect(ErrorEnvelope.safeParse({ success: true, error: "x" }).success).toBe(false);
    expect(ErrorEnvelope.safeParse({ success: false }).success).toBe(false);
  });
});
