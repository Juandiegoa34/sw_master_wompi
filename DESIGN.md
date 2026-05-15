---
name: SW Mujeres
description: Directorio curado de emprendedoras verificadas en Medellín, Colombia.
colors:
  burgundy: "#821641"
  burgundy-dark: "#5F1F3C"
  negro-profundo: "#391125"
  burgundy-light: "#A16579"
  rose-pale: "#E6B6C6"
  beige-warm: "#E7B1A5"
  cream: "#F7EFE9"
  pearl: "#FAF4F0"
  fg-secondary: "#6B3F4F"
  fg-tertiary: "#8E6571"
typography:
  display:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 3.625rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.025em"
    fontStyle: "italic"
  headline:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Montserrat, Helvetica Neue, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Montserrat, Helvetica Neue, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.18em"
    textTransform: "uppercase"
rounded:
  pill: "999px"
  card: "10px"
  hero-image: "18px"
  admin-nav: "6px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "36px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.burgundy}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.burgundy-dark}"
    textColor: "{colors.cream}"
  chip-filter:
    backgroundColor: "{colors.pearl}"
    textColor: "{colors.fg-secondary}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  chip-filter-active:
    backgroundColor: "{colors.burgundy}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  badge-verificada:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.burgundy}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
---

# Design System: SW Mujeres

## 1. Overview

**Creative North Star: "El Directorio de Confianza"**

Curaduría sin pretensiones. SW Mujeres no es un marketplace, no es una app de descubrimiento algorítmico, no es un feed. Es el equivalente digital de una persona de confianza que dice: "busca aquí, todas están verificadas." Cada decisión de diseño refuerza esa promesa: la interfaz se aparta, las emprendedoras aparecen, el contacto es inmediato.

El sistema opera en dos temperaturas. Las superficies públicas (landing, directorio, perfiles) son cálidas y editoriales: EB Garamond en itálica domina los titulares, el negro profundo (#391125) ancla el fondo de hero, y el cream (#F7EFE9) envuelve el contenido como papel de calidad. Las superficies de admin son funcionales y neutras, usando el mismo vocabulario de color pero sin la carga emocional.

Lo que este sistema explícitamente rechaza: la grilla infinita de tarjetas iguales que hace imposible elegir, los filtros técnicos tipo Excel que destruyen el registro emocional, el texto de relleno que nadie lee, y la estética genérica de marketplace que borra la identidad de cada mujer detrás de un SKU.

**Key Characteristics:**
- Serif itálica como voz principal del sistema (no decoración, estructura)
- Paleta bordeaux-cream que evoca calidez artesanal, no corporativo
- Jerarquía visual severa: pocos elementos compiten a la vez
- El badge "✓ Verificada" es un elemento de confianza, no un accesorio
- Hover en PreviewCard: la tarjeta se abre y revela un video, la descripción desaparece

## 2. Colors: La Paleta Bordeaux

Todos los colores del sistema descienden de una sola familia de hue: rojo-bordeaux profundo. No hay acento contrario. La calidez es total.

### Primary
- **Bordeaux Activo** (#821641): El color de acción. Botones primarios, links activos, el badge "Verificada", el texto de categoría en eyebrow. Nunca de fondo de superficies grandes.
- **Bordeaux Profundo** (#5F1F3C): Hover del color de acción y fondo de elementos interactivos en estado pressed. También el fondo de hero en algunos gradientes de tarjeta.

### Secondary
- **Negro Profundo** (#391125): El color más oscuro del sistema. Fondo de hero y footer. Nunca puro negro: siempre este bordeaux-negro.
- **Malva Suave** (#A16579): Texto de hover en tarjetas, borde activo en hover de PreviewCard. Estado intermedio entre el primary y los neutrales.

### Tertiary
- **Rosa Pálido** (#E6B6C6): Fondo del botón de búsqueda en el hero, avatares superpuestos. Elemento de calidez, no de acción.
- **Beige Cálido** (#E7B1A5): Usado en gradientes de fallback en tarjetas sin imagen. Hermano más rojizo del rosa pálido.

### Neutral
- **Cream** (#F7EFE9): El fondo base del sitio. Tintado hacia el hue, nunca blanco puro.
- **Pearl** (#FAF4F0): Fondo alternativo para secciones de menor jerarquía. Un escalón más claro que cream.
- **Texto Secundario** (#6B3F4F): Cuerpo de texto de apoyo, descripciones en tarjetas.
- **Texto Terciario** (#8E6571): Ciudad, metadata, placeholders. El tono más tenue del sistema.

### Named Rules
**La Regla del Hue Único.** Cada color del sistema es un derivado del mismo rojo-bordeaux. No se introduce ningún azul, verde, o neutro frío. Si un color parece fuera de familia, no pertenece aquí.

**La Regla del Fondo Tintado.** El fondo nunca es blanco puro. Siempre #F7EFE9 o más cálido. El blanco puro (#FFFFFF, "sw-paper") existe solo como fondo de tarjetas individuales, nunca de página.

## 3. Typography

**Display Font:** EB Garamond (Google Fonts, Latin subset, pesos 400/500/600, estilos normal e italic)
**Body Font:** Montserrat (Google Fonts, Latin subset, pesos 300/400/500/600/700)

**Character:** EB Garamond en itálica lleva el peso emocional del sistema: los titulares de hero, los nombres de negocios en tarjeta, los h1 de sección. Montserrat provee la estructura informativa: navegación, labels, cuerpo de texto. El contraste entre la calidez de la serif y la eficiencia de la sans es la firma tipográfica del sistema.

### Hierarchy
- **Display** (400 itálica, clamp 2.5rem→3.625rem, line-height 1.05, letter-spacing -0.025em): Hero principal. Una sola instancia por página.
- **Headline** (400 normal o itálica, 3rem, line-height 1.05, letter-spacing -0.01em): Título de sección. Ej: "Busca negocios verificados."
- **Title** (EB Garamond, 400 itálica, 1.375rem, line-height 1.15): Nombre de negocio en PreviewCard. El acento serif en contexto pequeño.
- **Body** (Montserrat, 400, 0.875rem, line-height 1.65): Todo el texto de apoyo. Máximo 65ch de ancho.
- **Label / Eyebrow** (Montserrat, 600, 0.6875rem, letter-spacing 0.18em, UPPERCASE): Categoría, sección, navegación. La voz del sistema en Montserrat a su mayor expresión.

### Named Rules
**La Regla de la Itálica con Propósito.** EB Garamond en itálica no es decoración: es la voz emocional del sistema. Se usa para titulares de hero y nombres de negocios. En cuerpo de texto o labels, nunca itálica.

**La Regla de los Pesos Puros.** El escalonado tipográfico usa contraste de escala Y peso. Un h1 a 58px peso 400 contrasta con un label a 11px peso 600. Escalas planas (todo igual peso) están prohibidas.

## 4. Elevation

El sistema usa sombras tintadas, nunca grises neutros. Todas las sombras se generan sobre el tono `rgba(57,17,37,...)` — el negro profundo bordeaux — para que parezcan parte de la luz del material, no artefactos gráficos.

En reposo, las tarjetas son casi planas (shadow-xs). La elevación emerge con la interacción: hover eleva con shadow-md y cambia el borde a malva suave. Esto refuerza la curaduría: los elementos duermen hasta que los despiertas.

### Shadow Vocabulary
- **Ambient** (`0 1px 2px rgba(57,17,37,0.04)`): PreviewCard en reposo. Distingue del fondo sin competir.
- **Soft** (`0 2px 6px rgba(57,17,37,0.06)`): Elementos UI flotantes menores. Inputs, chips.
- **Lifted** (`0 6px 18px rgba(57,17,37,0.08)`): PreviewCard en hover. El negocio "se acerca."
- **Elevated** (`0 18px 40px rgba(57,17,37,0.12)`): Modales, search pill en hero. Máxima elevación del sistema.

### Named Rules
**La Regla del Reposo Plano.** Las superficies son planas en reposo. La elevación es un estado, no una propiedad base. Nunca añadir shadow-md a un elemento que no esté en hover o focus.

## 5. Components

### Buttons
Los botones son píldoras: border-radius 999px. Confiados y directos, sin esquinas que intimidan.

- **Shape:** Píldora completa (border-radius: 999px)
- **Primary:** Fondo #821641, texto cream (#F7EFE9), padding 12px 28px, Montserrat 500 13px letter-spacing 0.04em
- **Hover / Focus:** Fondo #5F1F3C, transición 220ms cubic-bezier(0.16,1,0.3,1)
- **Ghost (admin):** Fondo transparente, borde 1px rgba(57,17,37,0.18), texto #6B3F4F

### Chips de Filtro
- **Style:** Fondo #FAF4F0, texto #6B3F4F, borde 1px rgba(57,17,37,0.10), border-radius 999px, padding 8px 16px, Montserrat 500 12px
- **Active:** Fondo #821641, texto cream, borde transparent
- **Hover:** Borde #A16579, transición 220ms

### PreviewCard (Componente Firma)
La tarjeta más importante del sistema. En reposo muestra imagen (o gradiente fallback) + nombre + descripción corta. En hover: la imagen se alarga (ratio 4/3 → 3/5), la descripción desaparece, un video se revela. El badge "✓ Verificada" permanece siempre visible.

- **Shape:** border-radius 10px, overflow hidden
- **Background:** #FFFFFF (papel limpio para el contenido)
- **Shadow:** Ambient en reposo → Lifted en hover
- **Border:** 1px rgba(57,17,37,0.10) en reposo → 1px #A16579 en hover
- **Padding interno:** 20px 22px 22px
- **Hover:** Transición de aspect-ratio y max-height con cubic-bezier(0.16,1,0.3,1) 380ms

### Badge Verificada
- **Style:** Fondo rgba(247,239,233,0.92), texto #821641, border-radius 999px, padding 5px 10px, Montserrat 600 11px
- **Posición:** Absoluta, top-right de la imagen. Siempre visible, incluso en hover.

### Search Pill
- **Style:** Fondo cream (#F7EFE9), border-radius 999px, padding 7px 7px 7px 18px, box-shadow shadow-elevated
- **Input:** Sin borde, sin outline, fondo transparent, Montserrat 400 12px
- **Submit button:** Círculo 38px, fondo rose-pale (#E6B6C6), ícono bordeaux (#821641)

### Inputs de Formulario
- **Style:** Borde 1px rgba(57,17,37,0.18), border-radius 8px, fondo pearl (#FAF4F0)
- **Focus:** Borde 1.5px #821641, outline none
- **Error:** Borde #C0392B (rojo puro, único color fuera de la familia hue)
- **Placeholder:** color #8E6571

### Navigation (Header)
- **Style:** Fondo del color de la página, borde inferior 1px rgba(57,17,37,0.10), padding 20px 64px
- **Links:** Montserrat 500 12px, letter-spacing 0.18em, UPPERCASE, opacity 0.85
- **Dark variant:** Todos los colores invierten a cream-sobre-negro. Logo filtrado a blanco.

## 6. Do's and Don'ts

### Do:
- **Do** usar EB Garamond en itálica para todos los titulares de hero y nombres de negocios. Es la firma emocional del sistema.
- **Do** usar sombras tintadas `rgba(57,17,37,...)`. Nunca grises neutros `rgba(0,0,0,...)` — rompen la calidez de la paleta.
- **Do** mostrar el badge "✓ Verificada" en toda tarjeta de negocio. Es la propuesta de valor principal del directorio.
- **Do** usar border-radius 999px para botones y filtros. La píldora comunica accesibilidad y modernidad sin frialdad.
- **Do** mantener el fondo base en #F7EFE9 (cream). Nunca blanco puro como fondo de página.
- **Do** usar Montserrat 600 UPPERCASE con letter-spacing 0.18em para eyebrows y labels de categoría. Es el contrapeso estructural de la serif.
- **Do** construir hover states con elevación: shadow-xs en reposo, shadow-md en hover, siempre con transición 220ms ease-out.

### Don't:
- **Don't** construir grillas de tarjetas idénticas en tamaño y peso visual. La curaduría implica jerarquía. Varía tamaños, alterna proporciones.
- **Don't** usar filtros técnicos tipo Excel: dropdowns alineados en columnas, labels genéricas tipo "Filtrar por:", tablas con muchas columnas. Este es un directorio cálido, no un ERP.
- **Don't** poner bloques de texto de más de 3 líneas en elementos de lista o tarjetas. Nadie lee párrafos en un directorio. Corta, trunca, omite.
- **Don't** usar un marketplace genérico como referencia: sin banners de descuento, sin precios prominentes, sin "Más vendido", sin estrellitas de rating.
- **Don't** usar gradientes de texto (`background-clip: text`). Los colores de acento van en propiedades de color sólido.
- **Don't** usar `border-left` mayor a 1px como acento de color en tarjetas o alertas. Si un elemento necesita énfasis, usa fondo tintado o el borde completo.
- **Don't** introducir ningún color fuera de la familia hue bordeaux-cream, excepto rojo de error en formularios (#C0392B).
- **Don't** usar el blanco puro (#FFFFFF) como fondo de página. Solo como fondo de tarjeta individual (PreviewCard).
