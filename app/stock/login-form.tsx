"use client";

import { useActionState } from "react";
import { login, type FormState } from "./actions";
import styles from "./stock.module.css";

export default function LoginForm() {
  const [state, action, pending] = useActionState<FormState | null, FormData>(
    login,
    null
  );

  return (
    <form action={action} className={styles.login}>
      <h1 className={styles.title}>Panel de stock</h1>
      <label htmlFor="password" className={styles.label}>
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className={styles.input}
      />
      {state && !state.ok && (
        <p role="alert" className={styles.error}>
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={styles.primaryButton}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
