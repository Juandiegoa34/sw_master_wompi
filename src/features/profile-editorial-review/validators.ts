import { z } from 'zod'

export const reviewRequestSchema = z.object({
  description: z.string().min(10, 'Descripción demasiado corta.').max(300, 'Descripción demasiado larga.'),
  sessionKey: z.string().min(1),
  source: z.enum(['user_form', 'admin_panel']).default('user_form'),
})
