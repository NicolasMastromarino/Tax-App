"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { registerAction, type ActionState } from "@/lib/actions/auth-actions";
import { noResetSubmit } from "@/lib/no-reset-form-action";
import { GoogleSignInButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
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
    <div className="flex min-h-screen bg-background">
      {/* Brand panel, hidden on small screens so the form stays front and center */}
      <div
        className="relative hidden w-[45%] flex-col justify-between overflow-hidden p-12 md:flex"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.10) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        <Link href={localizedPath(locale, "/")} className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/15">
            <span className="text-[17px] font-bold text-white">b</span>
          </span>
          <span className="text-base font-semibold text-white">Bookkeeply</span>
        </Link>

        <div className="relative flex max-w-md flex-col gap-5">
          <div className="text-[34px] font-semibold leading-tight text-white">{t.heroHeadline}</div>
          <div className="flex flex-col gap-3">
            {t.heroBenefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2.5">
                <Check className="h-[18px] w-[18px] shrink-0 text-white" strokeWidth={2.4} />
                <span className="text-sm text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/55">
          © {new Date().getFullYear()} Bookkeeply
        </div>
      </div>

      {/* Sign-up form */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">{t.title}</h1>
            <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
          </div>

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

          <p className="mt-6 text-sm text-muted">
            {t.haveAccount}{" "}
            <Link href={localizedPath(locale, "/login")} className="font-medium text-primary hover:underline">
              {t.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
