export class ProblemNotEditableError extends Error {
  constructor() {
    super('Problem can only be edited when status is TO_ANALYSIS')
  }
}
