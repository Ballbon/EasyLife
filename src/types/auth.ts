export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Record<string, string[]>;
};

export const initialAuthState: AuthFormState = { status: "idle" };
