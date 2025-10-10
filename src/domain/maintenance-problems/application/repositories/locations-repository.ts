import { PaginationParams } from '@/core/repositories/pagination-params'
import { Location } from '../../enterprise/entities/location'

export interface FetchLocationsParams extends PaginationParams {
  query?: string
  isActive?: boolean
  includeDeleted?: boolean
}

export abstract class LocationsRepository {
  abstract findMany(params: FetchLocationsParams): Promise<Location[]>
  abstract findById(id: string): Promise<Location | null>
  abstract create(location: Location): Promise<void>
  abstract save(location: Location): Promise<void>
  abstract delete(location: Location): Promise<void>
}
