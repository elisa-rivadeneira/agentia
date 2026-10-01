"use client";

import { useActionState } from "react";
import type { Producto } from "@/lib/stock";
import { guardarStock, type FormState } from "./actions";
import styles from "./stock.module.css";

export default function StockForm({ productos }: { productos: Producto[] }) {
  const [state, action, pending] = useActionState<FormState | null, FormData>(
    guardarStock,
    null
  );

  if (productos.length === 0) {
    return <p className={styles.empty}>No hay productos cargados.</p>;
  }

  // Agrupa por categoría manteniendo el orden que viene de la consulta.
  const porCategoria = new Map<string, Producto[]>();
  for (const p of productos) {
    const categoria = p.categoria ?? "Sin categoría";
    porCategoria.set(categoria, [...(porCategoria.get(categoria) ?? []), p]);
  }

  return (
    <form action={action}>
      {[...porCategoria].map(([categoria, items]) => (
        <section key={categoria} className={styles.section}>
          <h2 className={styles.category}>{categoria}</h2>
          <ul className={styles.list}>
            {items.map((p) => (
              <li key={p.id} className={styles.card}>
                <input type="hidden" name="id" value={p.id} />
                <p className={styles.name}>{p.nombre}</p>

                <div className={styles.controls}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Stock</span>
                    <input
                      name={`stock_${p.id}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      defaultValue={p.stock ?? ""}
                      placeholder="Sin límite"
                      className={styles.input}
                    />
                  </label>

                  <label className={styles.toggle}>
                    <input
                      name={`disponible_${p.id}`}
                      type="checkbox"
                      defaultChecked={p.disponible}
                      className={styles.toggleInput}
                    />
                    <span className={styles.toggleTrack} aria-hidden="true" />
                    <span className={styles.toggleText}>
                      <span className={styles.on}>Disponible</span>
                      <span className={styles.off}>Sin stock</span>
                    </span>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className={styles.saveBar}>
        {state && (
          <p
            role={state.ok ? "status" : "alert"}
            className={state.ok ? styles.success : styles.error}
          >
            {state.message}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className={styles.primaryButton}
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
