"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createReview } from "@/lib/content-repo";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  cleanText,
  detectSpam,
  parseRating,
  stripControlChars,
} from "@/lib/validation";

export interface ReviewFormState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

export const initialReviewState: ReviewFormState = { ok: false, message: "" };

export async function submitReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const honeypot = cleanText(formData.get("website"), 100);
  const elapsedRaw = cleanText(formData.get("elapsedMs"), 12);
  const elapsedMs = Number(elapsedRaw) || 0;

  const spamError = detectSpam({ honeypot, elapsedMs });
  if (spamError) {
    return { ok: false, message: spamError };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "desconocido";
  const limit = checkRateLimit(`review:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return {
      ok: false,
      message:
        "Recibimos varios envíos desde tu conexión. Esperá un rato antes de volver a intentar.",
    };
  }

  const displayName = stripControlChars(cleanText(formData.get("displayName"), 60));
  const comment = stripControlChars(cleanText(formData.get("comment"), 1000));
  const rating = parseRating(formData.get("rating"));

  const fieldErrors: Record<string, string> = {};
  if (displayName.length < 2) {
    fieldErrors.displayName = "Ingresá un nombre de al menos 2 caracteres.";
  }
  if (rating === null) {
    fieldErrors.rating = "Elegí una calificación de 1 a 5 estrellas.";
  }
  if (comment.length < 10) {
    fieldErrors.comment = "Contanos tu experiencia (mínimo 10 caracteres).";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Revisá los datos marcados.",
      fieldErrors,
    };
  }

  createReview({ displayName, rating: rating as number, comment });
  revalidatePath("/opiniones");
  revalidatePath("/admin/resenas");

  return {
    ok: true,
    message:
      "¡Gracias por tu opinión! Quedó pendiente de moderación y se publicará una vez aprobada.",
  };
}
