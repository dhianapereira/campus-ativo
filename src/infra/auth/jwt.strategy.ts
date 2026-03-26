import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from 'zod'
import { EnvService } from '../env/env.service'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'

const userPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z.enum(['REPORTER', 'MANAGER', 'DIRECTOR', 'ADMIN']).optional(),
})

export type UserPayload = z.infer<typeof userPayloadSchema>

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    env: EnvService,
    private usersRepository: UsersRepository,
  ) {
    const publicKey = env.get('JWT_PUBLIC_KEY')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    })
  }

  async validate(payload: UserPayload) {
    const validatedPayload = userPayloadSchema.parse(payload)

    // Verify if user is still active and always use the latest role from DB.
    const user = await this.usersRepository.findById(validatedPayload.sub)

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not active')
    }

    return {
      sub: validatedPayload.sub,
      role: user.role,
    }
  }
}
