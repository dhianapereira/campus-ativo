import { SetMetadata } from '@nestjs/common'

export interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export const RATE_LIMIT_METADATA_KEY = 'rate-limit'

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, options)
