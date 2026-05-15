# SW Master

Aplicacion Next.js para el directorio y panel administrativo de SW Mujeres.

## Getting Started

1. Instalar dependencias:

```bash
npm install
```

2. Crear variables locales desde el ejemplo:

```bash
cp .env.example .env.local
```

Completar `.env.local` con credenciales reales. Ese archivo esta ignorado por Git y no debe compartirse.

3. Ejecutar el servidor de desarrollo:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev`: servidor local.
- `npm run build`: build de produccion.
- `npm run start`: servir el build.
- `npm run lint`: lint del proyecto.
- `npm run sync:embeddings`: genera embeddings Gemini para perfiles de negocio existentes.

## Variables de entorno

Ver `.env.example` para la lista completa. No commitear `.env.local`, llaves de Supabase, JWT secrets, contrasenas de aplicacion de email, dumps de base de datos ni artefactos locales de asistentes.

## Base de datos

Los scripts SQL versionados viven en `supabase/sql/`.

## Chatbot y busqueda semantica

La rama `chatbot` agrega un asistente con Gemini y busqueda semantica sobre negocios del directorio. Ver [CHATBOT_SEMANTIC_SEARCH.md](CHATBOT_SEMANTIC_SEARCH.md) para arquitectura, setup, SQL, sincronizacion de embeddings y riesgos conocidos.

## Notas para colaboradores

Este repo usa Next.js 16. Antes de cambiar APIs o convenciones de Next, revisar las guias locales en `node_modules/next/dist/docs/`.
