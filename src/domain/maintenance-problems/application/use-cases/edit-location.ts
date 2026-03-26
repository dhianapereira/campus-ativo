import { left, right, Either } from '@/core/either'
import { Location } from '@/domain/maintenance-problems/enterprise/entities/location'
import { LocationsRepository } from '../repositories/locations-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { LocationInTrashError } from '@/core/errors/location-in-trash-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface EditLocationUseCaseRequest {
  locationId: string
  name: string
  code?: string | null
  description?: string | null
  isActive?: boolean
  userRole: UserRole
}

type EditLocationUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | LocationInTrashError,
  {
    location: Location
  }
>

@Injectable()
export class EditLocationUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute({
    locationId,
    name,
    code,
    description,
    isActive,
    userRole,
  }: EditLocationUseCaseRequest): Promise<EditLocationUseCaseResponse> {
    if (!RoleHierarchy.hasPermission(userRole, UserRole.MANAGER)) {
      return left(new NotAllowedError())
    }

    const location = await this.locationsRepository.findById(locationId)

    if (!location) {
      return left(new ResourceNotFoundError())
    }

    if (location.deletedAt) {
      return left(new LocationInTrashError())
    }

    location.name = name
    location.code = code
    location.description = description
    if (isActive !== undefined) {
      location.isActive = isActive
    }

    await this.locationsRepository.save(location)

    return right({
      location,
    })
  }
}
