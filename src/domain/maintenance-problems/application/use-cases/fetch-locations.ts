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
  pageSize?: number
}

type FetchLocationsUseCaseResponse = Either<
  NotAllowedError,
  {
    locations: Location[]
    total: number
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
    pageSize,
  }: FetchLocationsUseCaseRequest): Promise<FetchLocationsUseCaseResponse> {
    if (
      includeDeleted &&
      (!userRole || !RoleHierarchy.hasPermission(userRole, UserRole.MANAGER))
    ) {
      return left(new NotAllowedError())
    }

    const { items: locations, total } = await this.locationsRepository.findMany(
      {
        page,
        query,
        isActive,
        includeDeleted,
        pageSize,
      },
    )

    return right({
      locations,
      total,
    })
  }
}
