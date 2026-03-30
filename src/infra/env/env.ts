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
  CORS_ORIGIN: z.string().min(1).optional(),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_PREFIX: z.string().min(1).optional(),
  AWS_S3_SIGNED_URL_TTL: z.coerce.number().int().positive().default(900),
  SYSTEM_USER_EMAIL: z.string().min(1),
  SYSTEM_USER_NAME: z.string().min(1),
  SYSTEM_USER_POSITION: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>
