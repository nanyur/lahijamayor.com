# La Hija Mayor — sitio web

## Qué es esto
Un sitio de una sola página con:
- Calendario de eventos (lista + mapa) que se llena leyendo directo tu Google Sheet de eventos
- Directorio de músicos que se llena leyendo tu Google Sheet de músicos
- Sección "Sobre mí"

**No necesitas tocar el código para agregar eventos o músicos** — eso ya lo hacen los Google Forms. Solo tocas estos archivos si quieres cambiar el diseño, el texto de "Sobre mí", o los links de los Sheets.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub (público), por ejemplo `la-hija-mayor`.
2. Sube estos archivos y carpetas tal cual (mismo orden: `index.html` en la raíz, y las carpetas `css/`, `js/`, `assets/`).
3. Ve a **Settings > Pages** del repo.
4. En "Source" elige la rama `main` y la carpeta `/ (root)`. Guarda.
5. En un par de minutos tu sitio queda publicado en `https://tu-usuario.github.io/la-hija-mayor/`.

Para futuras actualizaciones de diseño: desde la app de GitHub en tu celular puedes editar cualquiera de estos archivos y hacer commit directo — se republica solo.

## Agregar tu logo y foto

Pon estos dos archivos dentro de la carpeta `assets/` (mismo nombre exacto):
- `assets/logo.png` — tu logo (el de fondo transparente, letras rosa/dorado)
- `assets/sobre-mi.jpg` — tu foto para la sección "Sobre mí"

Si no los subes, el sitio funciona igual, solo se ve el nombre en texto en vez del logo, y un círculo vacío en "Sobre mí".

## Editar el texto de "Sobre mí"

Abre `js/app.js`, busca la línea que dice `ABOUT_TEXT` casi hasta arriba, y cambia el texto entre comillas por tu historia real.

## Si cambias de Google Form más adelante

Si algún día rehaces alguno de los dos Forms (o cambias una pregunta de orden), las columnas se leen **por posición**, no por el texto de la pregunta. Eso significa que si agregas o quitas una pregunta al Form, tienes que actualizar los números en `js/app.js`:

- `EVENT_COLS` — para el Form de eventos
- `MUSICO_COLS` — para el Form de músicos

El número es la posición de la columna empezando en 0 (la primera columna, "Timestamp", siempre es 0).

## Sobre el mapa

Usa Leaflet + OpenStreetMap (gratis, sin necesidad de API key). Para ubicar cada evento en el mapa, el sitio traduce automáticamente el texto que pusiste en "Ciudad o lugar" a coordenadas (esto se llama geocodificación). Si un lugar no aparece en el mapa, probablemente el texto de la dirección es muy vago — edítalo en el Sheet para que sea más específico (nombre del lugar, ciudad, estado).

## Eventos pasados

Se ocultan solos — el sitio compara la fecha de cada evento con el día de hoy. No necesitas borrar filas del Sheet.
