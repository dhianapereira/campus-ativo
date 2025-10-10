const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{6,}$/

export class PasswordValidator {
  static isValid(password: string): boolean {
    return PASSWORD_REGEX.test(password)
  }

  static getRequirements(): string {
    return 'Password must be at least 6 characters long, contain at least one uppercase letter (A-Z) and one number (0-9).'
  }
}
