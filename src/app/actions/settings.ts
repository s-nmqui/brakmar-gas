"use server";

import { revalidatePath } from "next/cache";
import { updateSiteConfig } from "@/lib/settings-repo";
import { requireAdminAction } from "@/lib/auth";
import {
  cleanText,
  isNonEmpty,
  isValidUrl,
  isValidWhatsapp,
  stripControlChars,
} from "@/lib/validation";
import type { AdminFormState } from "./content";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function saveSiteConfigAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();

  const companyName = stripControlChars(cleanText(formData.get("companyName"), 80));
  const slogan = stripControlChars(cleanText(formData.get("slogan"), 160));
  const whatsapp = cleanText(formData.get("whatsapp"), 20);
  const whatsappDisplay = stripControlChars(cleanText(formData.get("whatsappDisplay"), 40));
  const schedule = stripControlChars(cleanText(formData.get("schedule"), 200));
  const locality = stripControlChars(cleanText(formData.get("locality"), 160));
  const address = stripControlChars(cleanText(formData.get("address"), 200));
  const deliveryInfo = stripControlChars(cleanText(formData.get("deliveryInfo"), 400));
  const shippingInfo = stripControlChars(cleanText(formData.get("shippingInfo"), 400));
  const email = cleanText(formData.get("email"), 160);
  const googleMapsUrl = cleanText(formData.get("googleMapsUrl"), 400);
  const midesSourceUrlDefault = cleanText(formData.get("midesSourceUrlDefault"), 300);

  const instagram = cleanText(formData.get("instagram"), 200);
  const facebook = cleanText(formData.get("facebook"), 200);
  const tiktok = cleanText(formData.get("tiktok"), 200);

  const fieldErrors: Record<string, string> = {};
  if (!isNonEmpty(companyName)) fieldErrors.companyName = "El nombre es obligatorio.";
  if (!whatsapp) fieldErrors.whatsapp = "El WhatsApp es obligatorio.";
  else if (!isValidWhatsapp(whatsapp)) {
    fieldErrors.whatsapp = "Ingresá un número de WhatsApp válido (con código de país).";
  }
  if (email && !EMAIL_RE.test(email)) fieldErrors.email = "Ingresá un correo válido.";
  if (googleMapsUrl && !isValidUrl(googleMapsUrl)) {
    fieldErrors.googleMapsUrl = "Ingresá una URL válida.";
  }
  if (instagram && !isValidUrl(instagram)) fieldErrors.instagram = "Ingresá una URL válida.";
  if (facebook && !isValidUrl(facebook)) fieldErrors.facebook = "Ingresá una URL válida.";
  if (tiktok && !isValidUrl(tiktok)) fieldErrors.tiktok = "Ingresá una URL válida.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos marcados.", fieldErrors };
  }

  updateSiteConfig({
    companyName,
    slogan,
    whatsapp,
    whatsappDisplay,
    schedule,
    locality,
    address,
    deliveryInfo,
    shippingInfo,
    email,
    googleMapsUrl,
    midesSourceUrlDefault,
    social: { instagram, facebook, tiktok },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  return { ok: true, message: "Configuración guardada." };
}

export async function saveSeoAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();

  const defaultTitle = stripControlChars(cleanText(formData.get("defaultTitle"), 160));
  const titleTemplate = stripControlChars(cleanText(formData.get("titleTemplate"), 160));
  const defaultDescription = stripControlChars(
    cleanText(formData.get("defaultDescription"), 320),
  );
  const keywords = stripControlChars(cleanText(formData.get("keywords"), 500));

  const fieldErrors: Record<string, string> = {};
  if (!isNonEmpty(defaultTitle)) fieldErrors.defaultTitle = "El título es obligatorio.";
  if (!titleTemplate.includes("%s")) {
    fieldErrors.titleTemplate = "La plantilla debe incluir %s donde va el título de cada página.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos marcados.", fieldErrors };
  }

  updateSiteConfig({
    seo: { defaultTitle, titleTemplate, defaultDescription, keywords },
  });

  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
  return { ok: true, message: "Ajustes SEO guardados." };
}
