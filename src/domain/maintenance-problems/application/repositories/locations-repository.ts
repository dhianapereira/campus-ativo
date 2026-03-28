import { PaginationParams } from '@/core/repositories/pagination-params'
import { PaginatedResult } from '@/core/repositories/paginated-result'
import { Location } from '../../enterprise/entities/location'

export interface FetchLocationsParams extends PaginationParams {
  query?: string
  isActive?: boolean
  includeDeleted?: boolean
}

export abstract class LocationsRepository {
  abstract findMany(
    params: FetchLocationsParams,
  ): Promise<PaginatedResult<Location>>
  abstract findById(id: string): Promise<Location | null>
  abstract findByName(name: string): Promise<Location | null>
  abstract findByNameOrCode(value: string): Promise<Location | null>
  abstract create(location: Location): Promise<void>
  abstract save(location: Location): Promise<void>
  abstract delete(location: Location): Promise<void>
  abstract hasAssociatedProblems(locationId: string): Promise<boolean>
}
