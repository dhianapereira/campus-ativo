import { right, Either } from '@/core/either'
import { left } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Location } from '../../enterprise/entities/location'
import { LocationsRepository } from '../repositories/locations-repository'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface FetchLocationsUseCaseRequest {
  page: number
  query?: string
  isActive?: boolean
  includeDeleted?: boolean
  userRole?: UserRole
}

type FetchLocationsUseCaseResponse = Either<
  NotAllowedError,
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
    userRole,
  }: FetchLocationsUseCaseRequest): Promise<FetchLocationsUseCaseResponse> {
    if (
      includeDeleted &&
      (!userRole || !RoleHierarchy.hasPermission(userRole, UserRole.MANAGER))
    ) {
      return left(new NotAllowedError())
    }

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
