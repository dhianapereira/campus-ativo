const ALLOWED_EMAIL_DOMAINS = [
  '@ifal.edu.br',
  '@aluno.ifal.edu.br'
] as const

export class EmailValidator {
  static isValidDomain(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim()
    return ALLOWED_EMAIL_DOMAINS.some(domain => normalizedEmail.endsWith(domain))
  }

  static getAllowedDomains(): readonly string[] {
    return ALLOWED_EMAIL_DOMAINS
  }
}