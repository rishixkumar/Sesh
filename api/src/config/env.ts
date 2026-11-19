import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().min(1).default("127.0.0.1"),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  AUTH_MODE: z.enum(["disabled", "test", "managed"]).default("disabled"),
  /**
   * Primary application database URL (PostgreSQL + PostGIS).
   * Required for readiness checks and future domain endpoints.
   */
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://sesh:sesh@127.0.0.1:5433/sesh"),
  /**
   * Isolated database for automated DB tests (MS3 §2.1).
   * Optional for the API process; used by test runners / drizzle against test DB.
   */
  DATABASE_URL_TEST: z
    .string()
    .min(1)
    .optional()
    .default("postgres://sesh:sesh@127.0.0.1:5433/sesh_test"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(
  source: Record<string, unknown> = process.env,
): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return result.data;
}
