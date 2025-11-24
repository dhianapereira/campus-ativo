export class Slug {
  public value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string) {
    return new Slug(value)
  }

  /**
   * Receives a string and normalize it as a slug with a unique UUID suffix.
   *
   * Example: "An example title" => "an-example-title-a1b2c3d4"
   *
   * @param text {string}
   */
  static createFromText(text: string): Slug {
    const slugText = text
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/_/g, '-')
      .replace(/--+/g, '-')
      .replace(/-$/g, '')

    // Add first 8 characters of UUID to ensure uniqueness
    const uniqueId = crypto.randomUUID().split('-')[0]
    const uniqueSlug = `${slugText}-${uniqueId}`

    return new Slug(uniqueSlug)
  }
}
