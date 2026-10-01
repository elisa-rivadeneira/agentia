import type { Metadata } from "next";
import { haySesion } from "@/lib/stock-auth";
import { listarProductos } from "@/lib/stock";
import { logout } from "./actions";
import LoginForm from "./login-form";
import StockForm from "./stock-form";
import styles from "./stock.module.css";

export const metadata: Metadata = {
  title: "Stock",
  robots: { index: false, follow: false },
};

export default async function StockPage() {
  if (!(await haySesion())) {
    return (
      <main className={styles.main}>
        <LoginForm />
      </main>
    );
  }

  const productos = await listarProductos();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Stock</h1>
        <form action={logout}>
          <button type="submit" className={styles.linkButton}>
            Salir
          </button>
        </form>
      </header>
      <StockForm productos={productos} />
    </main>
  );
}
