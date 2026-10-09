"use server";

import { revalidatePath } from "next/cache";
import {
  createFaq,
  createPromotion,
  deleteFaq,
  deletePromotion,
  deleteReview,
  getFaqById,
  getPromotionById,
  setReviewStatus,
  updateFaq,
  updateMidesInfo,
  updatePromotion,
} from "@/lib/content-repo";
import { requireAdminAction } from "@/lib/auth";
import { parsePriceToCents } from "@/lib/money";
import {
  cleanText,
  isNonEmpty,
  isValidUrl,
  parseIntSafe,
  stripControlChars,
} from "@/lib/validation";
import type { ReviewStatus } from "@/lib/types";

export interface AdminFormState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function dateOrNull(value: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/* ----------------------------- Promociones ----------------------------- */

export async function savePromotionAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();

  const id = parseIntSafe(formData.get("id"), 0);
  const title = stripControlChars(cleanText(formData.get("title"), 120));
  const description = stripControlChars(cleanText(formData.get("description"), 1200));
  const discountLabel = stripControlChars(cleanText(formData.get("discountLabel"), 60));
  const productIdRaw = parseIntSafe(formData.get("productId"), 0);
  const productId = productIdRaw > 0 ? productIdRaw : null;
  const startsAt = dateOrNull(cleanText(formData.get("startsAt"), 10));
  const endsAt = dateOrNull(cleanText(formData.get("endsAt"), 10));
  const isActive = formData.get("isActive") === "on";

  const fieldErrors: Record<string, string> = {};
  if (!isNonEmpty(title)) fieldErrors.title = "El título es obligatorio.";
  if (startsAt && endsAt && startsAt > endsAt) {
    fieldErrors.endsAt = "La fecha de fin no puede ser anterior al inicio.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos marcados.", fieldErrors };
  }

  const input = { title, description, discountLabel, productId, startsAt, endsAt, isActive };
  if (id > 0 && getPromotionById(id)) {
    updatePromotion(id, input);
  } else {
    createPromotion(input);
  }

  revalidatePath("/admin/promociones");
  revalidatePath("/promociones");
  revalidatePath("/");
  return { ok: true, message: "Promoción guardada." };
}

export async function deletePromotionAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  if (id > 0) deletePromotion(id);
  revalidatePath("/admin/promociones");
  revalidatePath("/promociones");
}

/* ------------------------------- Preguntas ------------------------------ */

export async function saveFaqAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();

  const id = parseIntSafe(formData.get("id"), 0);
  const question = stripControlChars(cleanText(formData.get("question"), 300));
  const answer = stripControlChars(cleanText(formData.get("answer"), 2000));
  const category = stripControlChars(cleanText(formData.get("category"), 60)) || "General";
  const sortOrder = parseIntSafe(formData.get("sortOrder"), 0);
  const isPublished = formData.get("isPublished") === "on";

  const fieldErrors: Record<string, string> = {};
  if (!isNonEmpty(question)) fieldErrors.question = "La pregunta es obligatoria.";
  if (!isNonEmpty(answer)) fieldErrors.answer = "La respuesta es obligatoria.";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos marcados.", fieldErrors };
  }

  const input = { question, answer, category, sortOrder, isPublished };
  if (id > 0 && getFaqById(id)) {
    updateFaq(id, input);
  } else {
    createFaq(input);
  }

  revalidatePath("/admin/faq");
  revalidatePath("/preguntas-frecuentes");
  return { ok: true, message: "Pregunta guardada." };
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  if (id > 0) deleteFaq(id);
  revalidatePath("/admin/faq");
  revalidatePath("/preguntas-frecuentes");
}

/* --------------------------------- MIDES -------------------------------- */

export async function saveMidesAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();

  const description = stripControlChars(cleanText(formData.get("description"), 2000));
  const requirements = stripControlChars(cleanText(formData.get("requirements"), 2000));
  const eligibility = stripControlChars(cleanText(formData.get("eligibility"), 2000));
  const normalRaw = cleanText(formData.get("normalPrice"), 30);
  const benefitRaw = cleanText(formData.get("benefitPrice"), 30);
  const normalPriceCents = normalRaw ? parsePriceToCents(normalRaw) : null;
  const benefitPriceCents = benefitRaw ? parsePriceToCents(benefitRaw) : null;
  const validFrom = cleanText(formData.get("validFrom"), 10);
  const validUntil = cleanText(formData.get("validUntil"), 10);
  const extraConditions = stripControlChars(cleanText(formData.get("extraConditions"), 2000));
  const sourceUrl = cleanText(formData.get("sourceUrl"), 300);

  const fieldErrors: Record<string, string> = {};
  if (normalRaw && normalPriceCents === null) {
    fieldErrors.normalPrice = "El precio normal debe ser un número válido.";
  }
  if (benefitRaw && benefitPriceCents === null) {
    fieldErrors.benefitPrice = "El precio con beneficio debe ser un número válido.";
  }
  if (sourceUrl && !isValidUrl(sourceUrl)) {
    fieldErrors.sourceUrl = "Ingresá una URL válida (http o https).";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos marcados.", fieldErrors };
  }

  updateMidesInfo({
    description,
    requirements,
    eligibility,
    normalPriceCents,
    benefitPriceCents,
    validFrom,
    validUntil,
    extraConditions,
    sourceUrl,
  });

  revalidatePath("/admin/mides");
  revalidatePath("/mides");
  return { ok: true, message: "Información MIDES actualizada." };
}

/* -------------------------------- Reseñas ------------------------------- */

export async function moderateReviewAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  const status = cleanText(formData.get("status"), 20) as ReviewStatus;
  if (id > 0 && (status === "approved" || status === "rejected" || status === "pending")) {
    setReviewStatus(id, status);
  }
  revalidatePath("/admin/resenas");
  revalidatePath("/opiniones");
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  if (id > 0) deleteReview(id);
  revalidatePath("/admin/resenas");
  revalidatePath("/opiniones");
}
