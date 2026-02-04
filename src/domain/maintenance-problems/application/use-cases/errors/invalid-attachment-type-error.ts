export class InvalidAttachmentTypeError extends Error {
  constructor(type: string) {
    super(
      `Invalid attachment type: ${type}. Only images are allowed (jpeg, jpg, png, gif, webp).`,
    )
  }
}
