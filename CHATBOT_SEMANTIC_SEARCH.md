# Chatbot y busqueda semantica con Gemini

Este documento resume los cambios de la rama `chatbot` comparada contra `master`.

La rama agrega un asistente flotante que conversa con la usuaria y, cuando detecta intencion de busqueda, recomienda negocios del directorio usando embeddings de Gemini guardados en Supabase.

## Resumen del cambio

Commits de la rama:

- `34802d3` - implementacion de chatbot y busqueda por embeddings.
- `121d333` - ajusta la visibilidad de la busqueda semantica para usar solicitudes aprobadas.

Archivos principales:

- `components/directorio/ChatBubble.tsx` - widget flotante del chat.
- `app/api/chat/route.ts` - endpoint que clasifica la consulta, busca negocios y responde.
- `lib/gemini.ts` - cliente Gemini, embeddings, clasificacion de intencion y generacion de respuestas.
- `supabase/sql/semantic_search_gemini.sql` - extension `pgvector`, columna `embedding` y RPC `match_businesses_gemini`.
- `scripts/sync-business-profile-embeddings.ts` - script para generar embeddings de perfiles existentes.
- `scripts/list-gemini-models.ts` - diagnostico manual para listar modelos si el SDK lo permite.
- `app/globals.css` - estilos del widget.
- `.env.example` y `package.json` - nuevas variables, dependencias y script.

## Flujo funcional

1. La usuaria abre el boton fijo `Buscar con IA`.
2. `ChatBubble` envia `POST /api/chat` con `{ "message": "..." }`.
3. El endpoint valida el cuerpo con Zod.
4. `classifyChatIntent()` decide si el mensaje es conversacion general o busqueda.
5. Si es conversacion general, Gemini responde sin consultar Supabase.
6. Si es busqueda, `generateTextEmbedding()` genera un embedding para la consulta.
7. Supabase ejecuta la RPC `match_businesses_gemini`.
8. La API filtra resultados por tema, ordena por similitud y limita a 3 negocios.
9. Gemini redacta una respuesta corta usando los resultados encontrados.
10. El frontend muestra la respuesta y tarjetas enlazadas a `/directorio/[slug]`.

## Requisitos de entorno

Agregar en `.env.local`:

```bash
GEMINI_API_KEY=
```

Tambien deben existir las variables habituales de Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Opcionalmente se puede definir:

```bash
GEMINI_CHAT_MODEL=
```

Si no se define, `lib/gemini.ts` intenta estos modelos en orden:

- `gemini-2.5-flash`
- `gemini-2.0-flash`
- `gemini-flash-latest`
- `gemini-2.0-flash-lite`

## Cambios de base de datos

Ejecutar en Supabase SQL Editor:

```sql
-- supabase/sql/semantic_search_gemini.sql
```

El script:

- habilita `vector` si no existe;
- agrega `business_profiles.embedding halfvec(3072)`;
- crea o reemplaza `public.match_businesses_gemini(...)`.

La RPC solo devuelve perfiles con:

- `business_profiles.embedding is not null`;
- membresia activa en `memberships`;
- `memberships.end_at > now()`;
- solicitud aprobada en `applications.status = 'aprobado'`;
- similitud mayor o igual al umbral solicitado.

Despues de ejecutar el SQL, recargar schema de PostgREST si Supabase no detecta el cambio inmediatamente:

```sql
notify pgrst, 'reload schema';
```

## Sincronizacion de embeddings

Para generar embeddings de perfiles existentes:

```bash
npm run sync:embeddings
```

El script lee `business_profiles`, construye texto searchable con:

- `business_name`
- `category`
- `description`

Luego llama a Gemini y actualiza `business_profiles.embedding`.

Nota tecnica: el script normaliza el vector a 3072 dimensiones. Si Gemini devuelve menos valores, rellena con ceros; si devuelve mas, recorta.

## API

Endpoint:

```http
POST /api/chat
Content-Type: application/json

{
  "message": "Busco joyeria hecha a mano en Medellin"
}
```

Respuesta esperada:

```json
{
  "reply": "Texto generado para la usuaria",
  "matches": [
    {
      "id": "...",
      "entrepreneur_id": "...",
      "slug": "...",
      "business_name": "...",
      "description": "...",
      "category": "...",
      "city": "...",
      "business_phone": "...",
      "instagram_handle": "...",
      "website_url": "...",
      "other_socials": "...",
      "directory_image_path": "...",
      "offers_discount": false,
      "discount_details": null,
      "similarity": 0.78
    }
  ]
}
```

Errores relevantes:

- `400` si el JSON es invalido o `message` esta vacio.
- `500` si no se puede generar embedding.
- `500` si falla la RPC de busqueda semantica.

Cuando Gemini falla por cuota o rate limit, la API intenta devolver una respuesta de fallback con resultados si ya los tenia.

## UI

`ChatBubble` es un Client Component con:

- boton flotante;
- panel de conversacion;
- sugerencias rapidas;
- textarea de consulta;
- estado de carga;
- tarjetas de resultados con imagen, categoria, ciudad, telefono y porcentaje de coincidencia.

Actualmente el widget se importa en:

- `app/layout.tsx`
- `app/directorio/page.tsx`

Esto puede renderizar dos instancias en `/directorio`. Si se quiere el chat global, deberia quedar solo en `app/layout.tsx`. Si se quiere solo en el directorio, deberia quitarse del layout.

## Dependencias nuevas

`package.json` agrega:

- `@google/generative-ai`
- `tsx`

Tambien agrega:

```json
"sync:embeddings": "tsx scripts/sync-business-profile-embeddings.ts"
```

## Como probar

1. Instalar dependencias:

```bash
npm install
```

2. Configurar `.env.local` con `GEMINI_API_KEY` y Supabase.
3. Ejecutar `supabase/sql/semantic_search_gemini.sql` en Supabase.
4. Sincronizar embeddings:

```bash
npm run sync:embeddings
```

5. Levantar Next:

```bash
npm run dev
```

6. Abrir `/directorio` o cualquier pagina si el chat queda global.
7. Probar consultas como:

```text
Busco joyeria hecha a mano en Medellin
Quiero negocios de tecnologia para emprender
Buscame marcas de ropa con descuento
```

## Riesgos y pendientes encontrados

- Posible duplicacion del widget en `/directorio` por estar en `layout` y en la pagina.
- `app/api/chat/route.ts` contiene bastante logica de negocio directamente en el route handler; el patron del repo prefiere servicios bajo `src/features`.
- Hay texto mojibake en algunos strings con tildes, por ejemplo `alimentaciÃ³n`; conviene normalizar encoding antes de tocar copy visible.
- `scripts/list-gemini-models.ts` existe, pero no tiene script npm asociado.
- La calidad de resultados depende de que todos los perfiles tengan `embedding` actualizado.
- Si cambia la dimension real del modelo de embeddings, hay que revisar `halfvec(3072)` y la normalizacion del script.
