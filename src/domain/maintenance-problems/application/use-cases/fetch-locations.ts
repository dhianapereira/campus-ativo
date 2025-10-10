import { right, Either } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Location } from '../../enterprise/entities/location'
import { LocationsRepository } from '../repositories/locations-repository'

interface FetchLocationsUseCaseRequest {
  page: number
  query?: string
  isActive?: boolean
  includeDeleted?: boolean
}

type FetchLocationsUseCaseResponse = Either<
  null,
  {
    locations: Location[]
  }
>

@Injectable()
export class FetchLocationsUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute({
    page,
    query,
    isActive,
    includeDeleted = false,
  }: FetchLocationsUseCaseRequest): Promise<FetchLocationsUseCaseResponse> {
    const locations = await this.locationsRepository.findMany({
      page,
      query,
      isActive,
      includeDeleted,
    })

    return right({
      locations,
    })
  }
}
