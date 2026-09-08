"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { BookOpen } from "lucide-react";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Set up bookkeeping for your business</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" autoComplete="name" required />
            <FieldError>{fieldErrors.name}</FieldError>
          </div>
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" required />
            <FieldError>{fieldErrors.businessName}</FieldError>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            <FieldError>{fieldErrors.email}</FieldError>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
            <FieldError>{fieldErrors.password}</FieldError>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
            <FieldError>{fieldErrors.confirmPassword}</FieldError>
          </div>
          <FieldError>{state.error}</FieldError>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
