export abstract class AttachmentUrlResolver {
  abstract resolve(storedValue: string): Promise<string>
}
