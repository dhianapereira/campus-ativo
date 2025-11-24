import { Slug } from './slug'

describe('Slug', () => {
  it('should create a slug from text with UUID suffix', () => {
    const slug = Slug.createFromText('Example problem title')

    expect(slug.value).toMatch(/^example-problem-title-[a-f0-9]{8}$/)
  })

  it('should normalize text to lowercase', () => {
    const slug = Slug.createFromText('UPPER CASE TEXT')

    expect(slug.value).toMatch(/^upper-case-text-[a-f0-9]{8}$/)
  })

  it('should replace spaces with hyphens', () => {
    const slug = Slug.createFromText('text with spaces')

    expect(slug.value).toMatch(/^text-with-spaces-[a-f0-9]{8}$/)
  })

  it('should remove special characters', () => {
    const slug = Slug.createFromText('text with @#$% special chars!')

    expect(slug.value).toMatch(/^text-with-special-chars-[a-f0-9]{8}$/)
  })

  it('should handle accented characters', () => {
    const slug = Slug.createFromText('Título com acentuação')

    expect(slug.value).toMatch(/^titulo-com-acentuacao-[a-f0-9]{8}$/)
  })

  it('should replace underscores with hyphens', () => {
    const slug = Slug.createFromText('text_with_underscores')

    expect(slug.value).toMatch(/^text-with-underscores-[a-f0-9]{8}$/)
  })

  it('should remove multiple consecutive hyphens', () => {
    const slug = Slug.createFromText('text---with---hyphens')

    expect(slug.value).toMatch(/^text-with-hyphens-[a-f0-9]{8}$/)
  })

  it('should trim leading and trailing spaces', () => {
    const slug = Slug.createFromText('  text with spaces  ')

    expect(slug.value).toMatch(/^text-with-spaces-[a-f0-9]{8}$/)
  })

  it('should create unique slugs for the same text', () => {
    const slug1 = Slug.createFromText('Same title')
    const slug2 = Slug.createFromText('Same title')

    expect(slug1.value).not.toBe(slug2.value)
    expect(slug1.value).toMatch(/^same-title-[a-f0-9]{8}$/)
    expect(slug2.value).toMatch(/^same-title-[a-f0-9]{8}$/)
  })

  it('should create a slug from an existing value', () => {
    const slug = Slug.create('existing-slug-12345678')

    expect(slug.value).toBe('existing-slug-12345678')
  })

  it('should handle empty text by adding only UUID', () => {
    const slug = Slug.createFromText('')

    expect(slug.value).toMatch(/^-[a-f0-9]{8}$/)
  })

  it('should handle text with only special characters', () => {
    const slug = Slug.createFromText('@#$%&*()')

    expect(slug.value).toMatch(/^-[a-f0-9]{8}$/)
  })

  it('should handle very long text', () => {
    const longText =
      'This is a very long text that should be slugified properly without any issues'
    const slug = Slug.createFromText(longText)

    expect(slug.value).toMatch(
      /^this-is-a-very-long-text-that-should-be-slugified-properly-without-any-issues-[a-f0-9]{8}$/,
    )
  })
})
