import { left, right, Either } from '@/core/either'
import { Location } from '@/domain/maintenance-problems/enterprise/entities/location'
import { LocationsRepository } from '../repositories/locations-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface TrashLocationUseCaseRequest {
  locationId: string
  userRole: UserRole
}

type TrashLocationUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    location: Location
  }
>

@Injectable()
export class TrashLocationUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute({
    locationId,
    userRole,
  }: TrashLocationUseCaseRequest): Promise<TrashLocationUseCaseResponse> {
    if (!RoleHierarchy.hasPermission(userRole, UserRole.MANAGER)) {
      return left(new NotAllowedError())
    }

    const location = await this.locationsRepository.findById(locationId)

    if (!location) {
      return left(new ResourceNotFoundError())
    }

    location.moveToTrash()

    await this.locationsRepository.save(location)

    return right({
      location,
    })
  }
}
