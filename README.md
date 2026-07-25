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

- El carrito es solo un contador de selección (no genera pedidos ni pagos) — vive en el
  navegador (`localStorage`), así que si cambia de dispositivo empieza en cero.
- Cualquier usuario que inicie sesión puede agregar, editar y eliminar productos y categorías.
- El campo "Cantidad disponible" de cada producto es el stock que tú defines al crearlo;
  es independiente del contador del carrito.
