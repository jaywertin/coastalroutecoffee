"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAdmin, type AdminActionState } from "@/app/admin/actions";

const initialAdminActionState: AdminActionState = { status: "idle", message: "" };

function SignInButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="mt-6 flex min-h-13 w-full items-center justify-center rounded-full bg-[#d5a04d] px-6 text-xs font-extrabold tracking-[0.16em] text-[#102638] uppercase transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-65">
      {pending ? "Opening the dashboard…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(loginAdmin, initialAdminActionState);
  return (
    <form action={action} className="mt-9">
      <label htmlFor="admin-password" className="block text-[0.68rem] font-extrabold tracking-[0.16em] text-white/72 uppercase">Admin password</label>
      <input
        id="admin-password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        autoFocus
        className="mt-3 min-h-14 w-full rounded-2xl border border-white/15 bg-white/8 px-5 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#d5a04d]"
        placeholder="Enter your password"
      />
      <SignInButton />
      {state.message ? <p className="mt-4 text-sm leading-6 text-[#f1c776]" role="alert">{state.message}</p> : null}
    </form>
  );
}
