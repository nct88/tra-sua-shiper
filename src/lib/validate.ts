import type { z } from "zod";
import { fail } from "./api";

// Đọc + kiểm tra body JSON theo schema Zod.
// Trả về { data } khi hợp lệ, hoặc { error: Response } để route trả về luôn.
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<
  | { data: z.infer<T>; error?: undefined }
  | { data?: undefined; error: ReturnType<typeof fail> }
> {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: fail(first?.message || "Dữ liệu không hợp lệ") };
  }
  return { data: parsed.data };
}
