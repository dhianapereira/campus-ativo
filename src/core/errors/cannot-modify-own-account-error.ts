export class CannotModifyOwnAccountError extends Error {
  constructor() {
    super('You cannot modify your own account')
  }
}
