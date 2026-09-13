"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/password-reset-actions";
import { noResetSubmit } from "@/lib/no-reset-form-action";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { BrandMark } from "@/components/brand-mark";
import { useLocale } from "@/i18n/use-locale";
import { localizedPath } from "@/i18n/locales";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";
import type { ActionState } from "@/lib/actions/auth-actions";

const initialState: ActionState = {};
const DICTIONARIES = { en: en_, es: es_ };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.auth.forgotPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="mb-3 h-11 w-11 rounded-xl" letterClassName="text-xl" />
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {state.success ? (
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t.sentTitle}</p>
              <p className="mt-2 text-sm text-muted">{t.sentBody}</p>
            </div>
          ) : (
            <form onSubmit={noResetSubmit(formAction)} className="space-y-4">
              <div>
                <Label htmlFor="email">{t.email}</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
                <FieldError>{translateMessage(dict, state.fieldErrors?.email)}</FieldError>
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? t.submitting : t.submit}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href={localizedPath(locale, "/login")} className="font-medium text-primary hover:underline">
            {t.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}
