-- Tabla de productos (Fase 2). Ejecutar en el SQL Editor de Supabase.
-- retailer_id debe coincidir con el "ID de contenido" / product_retailer_id
-- del producto en el catálogo de Meta: es la clave con la que llega el pedido.
create table if not exists productos (
  id          bigint generated always as identity primary key,
  retailer_id text    not null unique,
  nombre      text    not null,
  categoria   text,
  stock       integer check (stock >= 0),   -- NULL = sin límite
  disponible  boolean not null default true
);

-- Solo el servidor (service role) accede a la tabla; sin políticas = sin acceso público.
alter table productos enable row level security;
