import { left, right, Either } from '@/core/either'
import { Location } from '@/domain/maintenance-problems/enterprise/entities/location'
import { LocationsRepository } from '../repositories/locations-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface RestoreLocationUseCaseRequest {
  locationId: string
  userRole: UserRole
}

type RestoreLocationUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    location: Location
  }
>

@Injectable()
export class RestoreLocationUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute({
    locationId,
    userRole,
  }: RestoreLocationUseCaseRequest): Promise<RestoreLocationUseCaseResponse> {
    if (!RoleHierarchy.hasPermission(userRole, UserRole.MANAGER)) {
      return left(new NotAllowedError())
    }

    const location = await this.locationsRepository.findById(locationId)

    if (!location) {
      return left(new ResourceNotFoundError())
    }

    if (location.isPurged || !location.isInTrash) {
      return left(new NotAllowedError())
    }

    location.restoreFromTrash()

    await this.locationsRepository.save(location)

    return right({
      location,
    })
  }
}
