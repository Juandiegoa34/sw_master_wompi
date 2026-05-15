import { z } from 'zod'
import { CATEGORIES } from '@/src/shared/utils/categories'

const phoneRegex = /^\+\d{1,4}\d{7,15}$/   // dialCode+digits e.g. +573001234567
const cedulaRegex = /^\d{6,12}$/

export const step1Schema = z.object({
  cedula: z.string().regex(cedulaRegex, 'La cédula debe tener entre 6 y 12 dígitos.'),
  full_name: z
    .string()
    .refine(v => !/\d/.test(v), 'El nombre no puede contener números.')
    .refine(v => v.trim().split(/\s+/).filter(Boolean).length >= 2, 'Ingresa nombre y apellido.'),
  email: z.string().email('Correo electrónico no válido.'),
  phone: z.string().regex(phoneRegex, 'Teléfono no válido.'),
  fb_profile_url: z.string().url('URL de Facebook no válida.').refine(v => {
    try {
      return new URL(v).hostname.replace(/^www\./, '') === 'facebook.com'
    } catch { return false }
  }, 'Debe ser un enlace de Facebook (facebook.com).'),
})

export const step2Schema = z.object({
  business_name: z.string().min(2, 'Nombre del negocio demasiado corto.'),
  category: z.enum(CATEGORIES as [string, ...string[]], { error: () => 'Categoría no válida.' }),
  description: z.string().min(10, 'Descripción demasiado corta.').max(300, 'Descripción demasiado larga.'),
  business_phone: z.string().regex(phoneRegex, 'Teléfono de WhatsApp no válido.'),
  instagram_handle: z.string().optional(),  // already normalized to bare username by route.ts
  website_url: z.string().url('URL del sitio web no válida.').optional().or(z.literal('')),
  other_socials: z.string().optional(),
  offers_discount: z.boolean(),
  discount_details: z.string().optional(),
}).refine(
  data => !data.offers_discount || !!data.discount_details?.trim(),
  { message: 'Describe el descuento que ofreces.', path: ['discount_details'] }
)

export const step3Schema = z.object({
  product_id: z.string().uuid('Plan no válido.'),
  consent_accepted: z.literal(true, { error: () => 'Debes aceptar los términos.' }),
})

export const enrollmentSchema = step1Schema.and(step2Schema).and(step3Schema)
