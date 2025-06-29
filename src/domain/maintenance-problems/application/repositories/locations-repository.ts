import { PaginationParams } from '@/core/repositories/pagination-params'
import { Location } from '../../enterprise/entities/location'

export abstract class LocationsRepository {
  abstract findMany(params: PaginationParams): Promise<Location[]>
  abstract create(location: Location): Promise<void>
}
