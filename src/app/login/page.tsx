"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/login-action";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

const initialState: LoginState = {};

const BENEFITS = [
  "Sourced straight from the IRS, not guesswork",
  "Free to start — set up in under 10 minutes",
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel — hidden on small screens so the form stays front and center */}
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

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/15">
            <span className="text-[17px] font-bold text-white">b</span>
          </span>
          <span className="text-base font-semibold text-white">Bookkeeply</span>
        </div>

        <div className="relative flex max-w-md flex-col gap-5">
          <div className="text-[34px] font-semibold leading-tight text-white">
            Bookkeeping and taxes, without the dread.
          </div>
          <div className="flex flex-col gap-3">
            {BENEFITS.map((benefit) => (
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

      {/* Sign-in form */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Sign in to Bookkeeply</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <FieldError>{state.error}</FieldError>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
