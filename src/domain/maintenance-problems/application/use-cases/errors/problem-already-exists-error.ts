export class ProblemAlreadyExistsError extends Error {
  constructor() {
    super('Problem already exists')
  }
}
