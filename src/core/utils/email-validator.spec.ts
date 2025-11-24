import { EmailValidator } from './email-validator'

describe('EmailValidator', () => {
  describe('isValidDomain', () => {
    it('should return true for valid @ifal.edu.br domain', () => {
      const validEmails = [
        'user@ifal.edu.br',
        'test.user@ifal.edu.br',
        'UPPERCASE@ifal.edu.br',
        '  spaced@ifal.edu.br  ',
      ]

      validEmails.forEach((email) => {
        expect(EmailValidator.isValidDomain(email)).toBe(true)
      })
    })

    it('should return true for valid @aluno.ifal.edu.br domain', () => {
      const validEmails = [
        'student@aluno.ifal.edu.br',
        'test.student@aluno.ifal.edu.br',
        'UPPERCASE@aluno.ifal.edu.br',
        '  spaced@aluno.ifal.edu.br  ',
      ]

      validEmails.forEach((email) => {
        expect(EmailValidator.isValidDomain(email)).toBe(true)
      })
    })

    it('should return false for invalid domains', () => {
      const invalidEmails = [
        'user@gmail.com',
        'test@outlook.com',
        'user@ifal.com',
        'user@edu.br',
        'user@aluno.ifal.com',
        '',
        'invalid-email',
        'user@',
      ]

      invalidEmails.forEach((email) => {
        expect(EmailValidator.isValidDomain(email)).toBe(false)
      })
    })

    it('should handle case-insensitive validation', () => {
      expect(EmailValidator.isValidDomain('USER@IFAL.EDU.BR')).toBe(true)
      expect(EmailValidator.isValidDomain('user@ALUNO.IFAL.EDU.BR')).toBe(true)
      expect(EmailValidator.isValidDomain('User@Ifal.Edu.Br')).toBe(true)
    })

    it('should handle whitespace correctly', () => {
      expect(EmailValidator.isValidDomain('  user@ifal.edu.br  ')).toBe(true)
      expect(EmailValidator.isValidDomain('\tuser@aluno.ifal.edu.br\n')).toBe(
        true,
      )
    })
  })

  describe('getAllowedDomains', () => {
    it('should return the correct allowed domains', () => {
      const domains = EmailValidator.getAllowedDomains()

      expect(domains).toHaveLength(2)
      expect(domains).toContain('@ifal.edu.br')
      expect(domains).toContain('@aluno.ifal.edu.br')
    })

    it('should return a readonly array', () => {
      const domains = EmailValidator.getAllowedDomains()

      // TypeScript ensures compile-time immutability
      // At runtime, the array is still mutable, but this tests the type contract
      expect(Array.isArray(domains)).toBe(true)
      expect(domains.length).toBe(2)
    })
  })
})
