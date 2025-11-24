import {
  LocationsRepository,
  FetchLocationsParams,
} from '@/domain/maintenance-problems/application/repositories/locations-repository'
import { Location } from '@/domain/maintenance-problems/enterprise/entities/location'

export class InMemoryLocationsRepository implements LocationsRepository {
  public items: Location[] = []

  async findMany({
    page,
    query,
    isActive,
    includeDeleted = false,
  }: FetchLocationsParams) {
    let locations = this.items

    // Filter by deleted status (default: exclude deleted)
    if (!includeDeleted) {
      locations = locations.filter((location) => !location.isInTrash)
    }

    // Filter by isActive
    if (isActive !== undefined) {
      locations = locations.filter((location) => location.isActive === isActive)
    }

    // Filter by query (case-insensitive search in name and description)
    if (query) {
      const lowerQuery = query.toLowerCase()
      locations = locations.filter((location) => {
        const nameMatch = location.name.toLowerCase().includes(lowerQuery)
        const descriptionMatch =
          location.description?.toLowerCase().includes(lowerQuery) ?? false
        return nameMatch || descriptionMatch
      })
    }

    // Sort and paginate
    locations = locations
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20)

    return locations
  }

  async findById(id: string) {
    const location = this.items.find((item) => item.id.toValue() === id)

    if (!location) {
      return null
    }

    return location
  }

  async create(location: Location) {
    this.items.push(location)
  }

  async save(location: Location) {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(location.id),
    )

    this.items[itemIndex] = location
  }

  async delete(location: Location) {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(location.id),
    )

    this.items.splice(itemIndex, 1)
  }
}
