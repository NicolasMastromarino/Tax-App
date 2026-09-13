"use server";

import { Resend } from "resend";
import { contactSchema } from "@/lib/validations";
import type { ActionState } from "@/lib/actions/auth-actions";

const SUPPORT_EMAIL = "support@bookkeeply.me";

const SUBJECT_LABELS: Record<string, string> = {
  general: "General question",
  billing: "Billing question",
  bug: "Bug report",
  feature: "Feature request",
  other: "Something else",
};

export async function sendContactMessageAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  if (!process.env.RESEND_API_KEY) {
    return { error: "Message sending isn't configured yet. Try again shortly." };
  }

  const { name, email, subject, message } = parsed.data;
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "Bookkeeply Contact Form <onboarding@resend.dev>",
    to: SUPPORT_EMAIL,
    replyTo: email,
    subject: `[Contact] ${SUBJECT_LABELS[subject] ?? subject} from ${name}`,
    text: `From: ${name} <${email}>\nSubject: ${SUBJECT_LABELS[subject] ?? subject}\n\n${message}`,
  });

  if (error) {
    return { error: "Couldn't send your message right now. Try again shortly." };
  }

  return { success: true };
}
