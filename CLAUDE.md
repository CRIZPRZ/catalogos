# Catálogo de Suplementos — Contexto del Proyecto

## ¿Qué es esta app?

Catálogo de suplementos deportivos con vista pública para clientes y panel administrativo para gestionar productos y categorías. Los clientes pueden explorar, filtrar y contactar por WhatsApp. Los pedidos se realizan directamente por WhatsApp.

## Stack tecnológico

- **Framework:** React 18 + TypeScript + Vite
- **Estilos:** Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Base de datos / Storage:** Supabase (PostgreSQL + Storage para imágenes)
- **Despliegue:** Docker + Nginx (`Dockerfile`, `docker-compose.yml`, `nginx.conf`)
- **Gestor de paquetes:** pnpm (workspace definido en `pnpm-workspace.yaml`)

## Variables de entorno (`.env.local`)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_PASSWORD=...
```

## Estructura de archivos clave

```
src/
  api.ts                    — Todas las llamadas a Supabase (productos y categorías)
  lib/
    supabase.ts             — Cliente de Supabase
    processProductImage.ts  — Redimensiona imágenes antes de subir
  app/
    App.tsx                 — Componente raíz; estado global, filtros, routing de modales
    components/
      ProductCard.tsx       — Tarjeta de producto en la cuadrícula
      ProductDetail.tsx     — Modal de detalle con carrusel y zoom
      CategoryFilter.tsx    — Filtro de categorías horizontal
      AdminPanel.tsx        — Panel CRUD de productos y categorías (protegido)
      AdminLogin.tsx        — Modal de login por contraseña (sessionStorage)
      ui/                   — Componentes shadcn/ui generados
```

## Modelo de datos: `Product`

```ts
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;          // primera imagen (URL)
  images: string[];       // todas las imágenes
  description: string;    // descripción corta (tarjeta)
  inStock: boolean;       // true = disponible, false = agotado
  detailedDescription?: string;
  benefits?: string[];
  flavors?: string[];
  howToUse?: string;
  ingredients?: string;
  servings?: number;      // porciones, default 30
  rating?: number;        // 1-5, default 5
}
```

## Tablas en Supabase

| Tabla | Columnas relevantes |
|---|---|
| `products` | `id`, `name`, `category`, `price`, `image`, `images`, `description`, `in_stock`, `detailed_description`, `benefits`, `flavors`, `how_to_use`, `ingredients`, `servings`, `rating` |
| `categories` | `name` |

Storage bucket: `product-images` (público). Las imágenes se suben en `products/{timestamp}.{ext}`.

> **Mapeo DB ↔ TS:** `in_stock` ↔ `inStock`, `detailed_description` ↔ `detailedDescription`, `how_to_use` ↔ `howToUse`. La función `fromDB` / `toDB` en `api.ts` hace el mapeo.

## Flujo de disponibilidad de productos

| Estado (`inStock`) | Etiqueta en tarjeta | Botón en tarjeta | Botón en detalle |
|---|---|---|---|
| `true` | Badge verde "Disponible" | Verde "Entrega inmediata" + WhatsApp | Verde "Entrega inmediata por WhatsApp" |
| `false` | Badge rojo "Agotado" | Gris deshabilitado "Realizar pedido" | Gris deshabilitado "Realizar pedido" |

El botón de producto agotado **está deshabilitado** (`disabled`) — no abre WhatsApp.

## WhatsApp

- Número fijo: `527229056437` (constante `WHATSAPP_NUMBER` en `ProductCard.tsx` y `ProductDetail.tsx`)
- Mensaje al pedir: `Hola, me interesa el producto: *{name}* - ${price}`
- En detalle agrega: `\n¿Podrías darme más información?`

## Panel administrativo

- Acceso: botón "Login" (esquina superior derecha) → modal con contraseña (`VITE_ADMIN_PASSWORD`)
- Autenticación: `sessionStorage.setItem('adminAuth', '1')` — se pierde al cerrar pestaña
- Funciones: crear, editar, eliminar productos y categorías
- Imágenes: redimensionadas con `processProductImage` antes de subir a Supabase Storage
- Tamaño ideal de imagen: **1000×1000 px**, fondo blanco, JPG/PNG

## Comandos útiles

```bash
pnpm dev          # servidor de desarrollo
pnpm build        # build de producción (dist/)
docker-compose up # levantar con Docker
```

## Convenciones

- Sin comentarios en código salvo que el WHY sea no obvio
- Componentes en PascalCase, funciones en camelCase
- Tailwind para todos los estilos; sin CSS modules ni styled-components
- Los cambios al catálogo se persisten en Supabase, no en estado local
- `App.tsx` llama `api.getProducts()` después de cada mutación para refrescar desde la fuente
