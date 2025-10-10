import { CategoriesRepository, FetchCategoriesParams } from '@/domain/maintenance-problems/application/repositories/categories-repository'
import { Category } from '@/domain/maintenance-problems/enterprise/entities/category'

export class InMemoryCategoriesRepository implements CategoriesRepository {
  public items: Category[] = []

  async findMany({ page, query, isActive, includeDeleted = false }: FetchCategoriesParams) {
    let categories = this.items

    // Filter by deleted status (default: exclude deleted)
    if (!includeDeleted) {
      categories = categories.filter(category => !category.isInTrash)
    }

    // Filter by isActive
    if (isActive !== undefined) {
      categories = categories.filter(category => category.isActive === isActive)
    }

    // Filter by query (case-insensitive search in name and description)
    if (query) {
      const lowerQuery = query.toLowerCase()
      categories = categories.filter(category => {
        const nameMatch = category.name.toLowerCase().includes(lowerQuery)
        const descriptionMatch = category.description?.toLowerCase().includes(lowerQuery) ?? false
        return nameMatch || descriptionMatch
      })
    }

    // Sort and paginate
    categories = categories
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20)

    return categories
  }

  async findById(id: string) {
    const category = this.items.find((item) => item.id.toValue() === id)

    if (!category) {
      return null
    }

    return category
  }

  async create(category: Category) {
    this.items.push(category)
  }

  async save(category: Category) {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(category.id),
    )

    this.items[itemIndex] = category
  }

  async delete(category: Category) {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(category.id),
    )

    this.items.splice(itemIndex, 1)
  }
}
