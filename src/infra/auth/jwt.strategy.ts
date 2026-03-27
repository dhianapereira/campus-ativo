import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from 'zod'
import { EnvService } from '../env/env.service'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

const userPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z
    .enum(['SYSTEM', 'REPORTER', 'MANAGER', 'DIRECTOR', 'ADMIN'])
    .optional(),
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

    // Tokens may outlive role/status changes, so authorization is always based
    // on the current database state instead of trusting the embedded payload.
    const user = await this.usersRepository.findById(validatedPayload.sub)

    if (!user || !user.isActive || RoleHierarchy.isSystemRole(user.role)) {
      throw new UnauthorizedException('User is not active')
    }

    return {
      sub: validatedPayload.sub,
      role: user.role,
    }
  }
}
