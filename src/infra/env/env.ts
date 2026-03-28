import { z } from 'zod'

const optionalPortSchema = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return undefined
  }

  return value
}, z.coerce.number().int().positive().optional().default(3333))

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  PORT: optionalPortSchema,
  IMGBB_API_KEY: z.string(),
  SYSTEM_USER_EMAIL: z.string().min(1),
  SYSTEM_USER_NAME: z.string().min(1),
  SYSTEM_USER_POSITION: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>
