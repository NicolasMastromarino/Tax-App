"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendContactMessageAction } from "@/lib/actions/contact-actions";
import { noResetSubmit } from "@/lib/no-reset-form-action";
import { translateMessage } from "@/i18n/translate-message";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function ContactForm({ dict }: { dict: Dictionary }) {
  const t = dict.contact.form;
  const [state, formAction, pending] = useActionState(sendContactMessageAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(t.sentToast);
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form ref={formRef} onSubmit={noResetSubmit(formAction)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">{t.name}</Label>
          <Input id="name" name="name" placeholder={t.namePlaceholder} required />
          <FieldError>{translateMessage(dict, fieldErrors.name)}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">{t.email}</Label>
          <Input id="email" name="email" type="email" placeholder={t.emailPlaceholder} required />
          <FieldError>{translateMessage(dict, fieldErrors.email)}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="subject">{t.subject}</Label>
        <Select id="subject" name="subject" defaultValue="general">
          {Object.entries(t.subjectOptions).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <FieldError>{translateMessage(dict, fieldErrors.subject)}</FieldError>
      </div>

      <div>
        <Label htmlFor="message">{t.message}</Label>
        <Textarea id="message" name="message" rows={5} placeholder={t.messagePlaceholder} required />
        <FieldError>{translateMessage(dict, fieldErrors.message)}</FieldError>
      </div>

      {state.error && <p className="text-sm text-danger">{translateMessage(dict, state.error)}</p>}

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending ? t.sending : t.send}
      </Button>
    </form>
  );
}
