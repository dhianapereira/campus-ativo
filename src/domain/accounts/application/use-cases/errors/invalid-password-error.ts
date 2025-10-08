export class InvalidPasswordError extends Error {
  constructor() {
    super('Password must be at least 6 characters long, contain at least one uppercase letter and one number.')
  }
}
