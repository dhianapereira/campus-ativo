export class Slug {
  public value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string) {
    return new Slug(value)
  }

  /**
   * Normalizes a string into a slug and appends a short UUID suffix for uniqueness.
   *
   * Example: "An example title" => "an-example-title-a1b2c3d4"
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

    const uniqueId = crypto.randomUUID().split('-')[0]
    const uniqueSlug = `${slugText}-${uniqueId}`

    return new Slug(uniqueSlug)
  }
}
