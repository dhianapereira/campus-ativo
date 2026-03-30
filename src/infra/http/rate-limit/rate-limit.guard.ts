import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  RATE_LIMIT_METADATA_KEY,
  RateLimitOptions,
} from './rate-limit.decorator'

interface RateLimitEntry {
  count: number
  resetAt: number
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly entries = new Map<string, RateLimitEntry>()

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!options) {
      return true
    }

    const request = context.switchToHttp().getRequest<{
      user?: { sub?: string }
      ip?: string
      headers?: Record<string, string | string[] | undefined>
    }>()
    const subject = request.user?.sub
    const ipAddress = this.extractIpAddress(request)
    const identifiers = [
      subject
        ? `${options.key}:user:${subject}`
        : null,
      ipAddress
        ? `${options.key}:ip:${ipAddress}`
        : null,
    ].filter((value): value is string => Boolean(value))

    for (const identifier of identifiers) {
      this.hit(identifier, options)
    }

    return true
  }

  private hit(identifier: string, options: RateLimitOptions) {
    const now = Date.now()
    const current = RateLimitGuard.entries.get(identifier)

    if (!current || current.resetAt <= now) {
      RateLimitGuard.entries.set(identifier, {
        count: 1,
        resetAt: now + options.windowMs,
      })
      return
    }

    if (current.count >= options.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000),
      )
      throw new HttpException(
        `Muitas requisições. Tente novamente em ${retryAfterSeconds}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    current.count += 1
    RateLimitGuard.entries.set(identifier, current)
  }

  private extractIpAddress(request: {
    ip?: string
    headers?: Record<string, string | string[] | undefined>
  }) {
    const forwardedFor = request.headers?.['x-forwarded-for']
    const forwardedValue = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor

    if (forwardedValue) {
      return forwardedValue.split(',')[0]?.trim() || null
    }

    return request.ip ?? null
  }
}
