import { getSupabase } from "@/lib/supabase";

export interface Producto {
  id: number;
  retailer_id: string;
  nombre: string;
  categoria: string | null;
  stock: number | null;
  disponible: boolean;
}

export interface ItemPedido {
  product_retailer_id: string;
  quantity: number;
}

export interface ProductoNoDisponible {
  retailer_id: string;
  nombre: string;
}

/**
 * Regla de disponibilidad por producto:
 *  - disponible == false              -> rechazar (sin importar el stock)
 *  - disponible == true, stock NULL   -> aceptar (sin límite)
 *  - disponible == true, stock != NULL -> aceptar solo si stock >= cantidad
 */
export function hayStock(producto: Producto, cantidad: number): boolean {
  if (!producto.disponible) return false;
  if (producto.stock === null) return true;
  return producto.stock >= cantidad;
}

/**
 * Devuelve los productos del pedido que no se pueden atender. Si un mismo
 * producto aparece en varias líneas se suman sus cantidades. Un producto que
 * no existe en la tabla se trata como no disponible.
 */
export function productosNoDisponibles(
  items: ItemPedido[],
  productos: Producto[]
): ProductoNoDisponible[] {
  const porRetailerId = new Map(productos.map((p) => [p.retailer_id, p]));

  const cantidades = new Map<string, number>();
  for (const item of items) {
    cantidades.set(
      item.product_retailer_id,
      (cantidades.get(item.product_retailer_id) ?? 0) + item.quantity
    );
  }

  const noDisponibles: ProductoNoDisponible[] = [];
  for (const [retailerId, cantidad] of cantidades) {
    const producto = porRetailerId.get(retailerId);
    if (!producto) {
      noDisponibles.push({ retailer_id: retailerId, nombre: retailerId });
    } else if (!hayStock(producto, cantidad)) {
      noDisponibles.push({ retailer_id: retailerId, nombre: producto.nombre });
    }
  }
  return noDisponibles;
}

/** Consulta en Supabase y valida los items de un pedido. */
export async function validarDisponibilidad(
  items: ItemPedido[]
): Promise<ProductoNoDisponible[]> {
  const ids = [...new Set(items.map((i) => i.product_retailer_id))];

  const { data, error } = await getSupabase()
    .from("productos")
    .select("id, retailer_id, nombre, categoria, stock, disponible")
    .in("retailer_id", ids);

  if (error) {
    throw new Error(`No se pudo consultar productos: ${error.message}`);
  }

  return productosNoDisponibles(items, (data ?? []) as Producto[]);
}

/** Lista todos los productos para el panel de stock. */
export async function listarProductos(): Promise<Producto[]> {
  const { data, error } = await getSupabase()
    .from("productos")
    .select("id, retailer_id, nombre, categoria, stock, disponible")
    .order("categoria", { nullsFirst: false })
    .order("nombre");

  if (error) {
    throw new Error(`No se pudo listar productos: ${error.message}`);
  }
  return (data ?? []) as Producto[];
}
