"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/actions/password-reset-actions";
import { noResetSubmit } from "@/lib/no-reset-form-action";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
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
  const loginHero = dict.auth.login;

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
          <div className="text-[34px] font-semibold leading-tight text-white">{loginHero.heroHeadline}</div>
          <div className="flex flex-col gap-3">
            {loginHero.heroBenefits.map((benefit) => (
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

      {/* Request form */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">{t.title}</h1>
            <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
          </div>

          {state.success ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
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

          <p className="mt-6 text-sm text-muted">
            <Link href={localizedPath(locale, "/login")} className="font-medium text-primary hover:underline">
              {t.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
