export class InvalidEmailDomainError extends Error {
  constructor(email: string) {
    super(
      `The email "${email}" domain is not allowed. Only @ifal.edu.br and @aluno.ifal.edu.br domains are permitted.`,
    )
  }
}
