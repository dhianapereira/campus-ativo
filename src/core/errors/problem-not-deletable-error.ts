export class ProblemNotDeletableError extends Error {
  constructor() {
    super('Problem can only be moved to trash when status is TO_ANALYSIS')
  }
}
