export class ReporterAlreadyExistsError extends Error {
  constructor(identifier: string) {
    super(`Reporter "${identifier}" already exists.`)
  }
}
