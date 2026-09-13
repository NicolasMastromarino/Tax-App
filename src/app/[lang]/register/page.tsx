"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth-actions";
import { noResetSubmit } from "@/lib/no-reset-form-action";
import { GoogleSignInButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { BrandMark } from "@/components/brand-mark";
import { useLocale } from "@/i18n/use-locale";
import { localizedPath } from "@/i18n/locales";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

const initialState: ActionState = {};
const DICTIONARIES = { en: en_, es: es_ };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.auth.register;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="mb-3 h-11 w-11 rounded-xl" letterClassName="text-xl" />
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <GoogleSignInButton locale={locale} label={dict.auth.continueWithGoogle} />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted">{dict.auth.orDivider}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={noResetSubmit(formAction)} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <div>
              <Label htmlFor="name">{t.yourName}</Label>
              <Input id="name" name="name" autoComplete="name" required />
              <FieldError>{translateMessage(dict, fieldErrors.name)}</FieldError>
            </div>
            <div>
              <Label htmlFor="businessName">{t.businessName}</Label>
              <Input id="businessName" name="businessName" required />
              <FieldError>{translateMessage(dict, fieldErrors.businessName)}</FieldError>
            </div>
            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
              <FieldError>{translateMessage(dict, fieldErrors.email)}</FieldError>
            </div>
            <div>
              <Label htmlFor="password">{t.password}</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
              <FieldError>{translateMessage(dict, fieldErrors.password)}</FieldError>
            </div>
            <div>
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
              <FieldError>{translateMessage(dict, fieldErrors.confirmPassword)}</FieldError>
            </div>
            <FieldError>{translateMessage(dict, state.error)}</FieldError>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t.submitting : t.submit}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          {t.haveAccount}{" "}
          <Link href={localizedPath(locale, "/login")} className="font-medium text-primary hover:underline">
            {t.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
