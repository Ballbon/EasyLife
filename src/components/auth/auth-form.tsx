"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialAuthState, type AuthFormState } from "@/types/auth";

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

type AuthFormProps = {
  action: AuthAction;
  mode: "login" | "register" | "forgot" | "reset";
};

const modeLabels = {
  login: "เข้าสู่ระบบ",
  register: "สร้างบัญชี",
  forgot: "ส่งลิงก์ตั้งรหัสผ่าน",
  reset: "บันทึกรหัสผ่านใหม่",
};

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  const showEmail = mode !== "reset";
  const showPassword =
    mode === "login" || mode === "register" || mode === "reset";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {mode === "register" ? (
        <Field
          id="displayName"
          label="ชื่อที่ใช้ในแอป"
          error={state.errors?.displayName?.[0]}
          autoComplete="name"
        />
      ) : null}

      {showEmail ? (
        <Field
          id="email"
          label="อีเมล"
          type="email"
          error={state.errors?.email?.[0]}
          autoComplete="email"
        />
      ) : null}

      {showPassword ? (
        <Field
          id="password"
          label={mode === "reset" ? "รหัสผ่านใหม่" : "รหัสผ่าน"}
          type="password"
          error={state.errors?.password?.[0]}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      ) : null}

      {mode === "register" || mode === "reset" ? (
        <Field
          id="confirmPassword"
          label="ยืนยันรหัสผ่าน"
          type="password"
          error={state.errors?.confirmPassword?.[0]}
          autoComplete="new-password"
        />
      ) : null}

      {mode === "login" ? (
        <div className="text-right text-sm">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>
      ) : null}

      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? "กำลังดำเนินการ..." : modeLabels[mode]}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
