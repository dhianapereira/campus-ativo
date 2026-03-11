export class InvalidLocationNameError extends Error {
  constructor() {
    super('Location name is required')
  }
}
