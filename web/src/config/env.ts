import { z } from "zod";
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1),
});

const envResult = envSchema.safeParse(
  (import.meta as ImportMeta & { env: Record<string, unknown> }).env,
);

if (!envResult.success) {
  throw new Error(
    `Invalid environment variables: ${envResult.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ")}`,
  );
}

export const env = envResult.data;
