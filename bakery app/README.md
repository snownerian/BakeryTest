# 🥐 Dulce Registro

Gestor de productos con carrito de selección para pastelería. Pensado para que tu novia pueda
buscar, ver fotos, y sumar cantidades de productos con el mouse o el teclado (flechas + Enter),
sin margen de error.

## Funcionalidades

- Login con usuario y contraseña (Supabase Auth).
- Tarjetas de producto con foto, descripción, precio y cantidad disponible.
- Carrito simple: solo suma cantidades seleccionadas y muestra el total (cantidad y S/).
- Selección con teclado: `↑ ↓ ← →` para moverte entre tarjetas, `Enter` para sumar 1 al carrito.
- Barra de búsqueda en vivo por nombre/descripción.
- Categorías agregables (ya vienen creadas: Tortas, Bocaditos dulces, Bocaditos salados,
  Panes, Kekes, Pies, Cheesecakes) y puedes agregar más desde la app.
- Subida de fotos de producto a Supabase Storage.
- CRUD de productos (crear, editar, eliminar) desde la propia interfaz.

---

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (gratis).
2. Entra a **SQL Editor > New query**, pega todo el contenido de `supabase/schema.sql`
   de este proyecto y dale **Run**. Esto crea:
   - la tabla `categories` (con las 7 categorías ya cargadas),
   - la tabla `products`,
   - las políticas de seguridad (RLS),
   - el bucket de Storage `product-images` con sus políticas.
3. Si el paso del bucket falla por permisos, créalo a mano en
   **Storage > New bucket** con nombre `product-images` y **Public bucket: sí**,
   y vuelve a correr solo la parte de `create policy ...` del archivo.
4. (Opcional, recomendado para uso personal) En **Authentication > Providers > Email**,
   desactiva "Confirm email" para que las cuentas nuevas no necesiten verificar correo.
   Si lo dejas activado, tu novia deberá confirmar el correo antes de poder entrar.

## 2. Crear el usuario de acceso

Tienes dos opciones:

**A. Desde la propia app:** abre la app, click en "¿Primera vez? Crear una cuenta",
ingresa el correo y contraseña que va a usar.

**B. Desde el panel de Supabase:** ve a **Authentication > Users > Add user**
y crea el usuario y contraseña ahí directamente (más rápido si quieres dárselo ya creado).

## 3. Conectar la app con tu proyecto de Supabase

Abre `js/config.js` y reemplaza estos dos valores
(los encuentras en **Project Settings > API** dentro de Supabase):

```js
export const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
export const SUPABASE_ANON_KEY = "TU-ANON-KEY-AQUI";
```

La `anon key` es pública por diseño (no es secreta); la seguridad real la dan
las políticas RLS que ya quedaron configuradas con el script SQL.

## 4. Probar en tu computadora

No necesitas instalar nada (es HTML/CSS/JS puro), pero los navegadores bloquean los
`import` de módulos si abres el archivo directo con doble click. Usa un servidor local simple:

```bash
# Con Python (viene instalado en Mac/Linux)
python3 -m http.server 5500

# o con Node
npx serve .
```

Luego abre `http://localhost:5500` en tu navegador.

## 5. Subir a GitHub

```bash
git init
git add .
git commit -m "Dulce Registro: gestor de productos con carrito"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/dulce-registro.git
git push -u origin main
```

## 6. Desplegar en Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. **Add New... > Project**, elige el repositorio que acabas de subir.
3. Framework Preset: **Other** (es un sitio estático, no necesita build).
4. Deploy. Listo — Vercel te da una URL pública para compartirle a tu novia.

---

## Estructura del proyecto

```
├── index.html              # Login + app principal + modal de producto
├── css/style.css           # Estilos
├── js/
│   ├── config.js           # URL y anon key de Supabase (edítalo)
│   ├── supabaseClient.js   # Cliente de Supabase
│   ├── auth.js             # Login / registro / logout
│   ├── cart.js             # Estado del carrito (localStorage)
│   └── main.js              # Render, búsqueda, categorías, teclado, CRUD
├── supabase/schema.sql     # Tablas, políticas RLS, bucket de imágenes
└── vercel.json
```

## Cómo se usa (para tu novia)

- Escribe en el buscador para filtrar productos, o toca una categoría.
- Toca una tarjeta (o usa `+`/`–`) para sumar o restar unidades al carrito.
- Con el teclado: clic en el buscador, luego `↓` para entrar a las tarjetas,
  `← → ↑ ↓` para moverte y `Enter` para sumar 1 unidad.
- Arriba a la derecha siempre se ve el total de unidades seleccionadas y el total en soles.
- "Vaciar selección" reinicia el carrito a cero.

## Notas

- El carrito es solo un contador de selección (no genera pedidos ni pagos) — vive en el
  navegador (`localStorage`), así que si cambia de dispositivo empieza en cero.
- Cualquier usuario que inicie sesión puede agregar, editar y eliminar productos y categorías.
- El campo "Cantidad disponible" de cada producto es el stock que tú defines al crearlo;
  es independiente del contador del carrito.
