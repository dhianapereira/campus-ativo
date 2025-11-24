import { UserRole } from '@/domain/accounts/enterprise/entities/user'

export class RoleHierarchy {
  private static readonly hierarchy: Record<UserRole, number> = {
    [UserRole.REPORTER]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.DIRECTOR]: 3,
    [UserRole.ADMIN]: 4,
  }

  static hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    return this.hierarchy[userRole] >= this.hierarchy[requiredRole]
  }

  static canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    if (managerRole === UserRole.ADMIN) {
      return true
    }

    if (managerRole === UserRole.DIRECTOR) {
      return targetRole !== UserRole.ADMIN && targetRole !== UserRole.DIRECTOR
    }

    return false
  }

  static getRolePermissions(role: UserRole): UserRole[] {
    const roleLevel = this.hierarchy[role]
    return Object.entries(this.hierarchy)
      .filter(([, level]) => level <= roleLevel)
      .map(([roleName]) => roleName as UserRole)
  }
}
