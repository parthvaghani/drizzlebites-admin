import { z } from 'zod'

export const productSchema = z.object({
  _id: z.string(),
  id: z.string(),
  category: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isPremium: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  variants: z.record(z.string(), z.any()).optional(),
  images: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
})

export type Product = z.infer<typeof productSchema>
