export class CategoryInTrashError extends Error {
  constructor() {
    super('Category is in trash')
  }
}
