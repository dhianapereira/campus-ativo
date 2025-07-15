export class UnauthorizedRoleChangeError extends Error {
  constructor() {
    super('User is not authorized to change this role')
  }
}
