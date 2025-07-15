import { SetMetadata } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

export const MIN_ROLE_KEY = 'minRole'
export const RequireMinRole = (minRole: UserRole) => SetMetadata(MIN_ROLE_KEY, minRole)