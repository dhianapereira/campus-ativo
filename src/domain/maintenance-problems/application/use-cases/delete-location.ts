import { left, right, Either } from '@/core/either'
import { LocationsRepository } from '../repositories/locations-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface DeleteLocationUseCaseRequest {
  locationId: string
  userRole: UserRole
}

type DeleteLocationUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  object
>

@Injectable()
export class DeleteLocationUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute({
    locationId,
    userRole,
  }: DeleteLocationUseCaseRequest): Promise<DeleteLocationUseCaseResponse> {
    // Only Manager+ can delete locations permanently
    if (!RoleHierarchy.hasPermission(userRole, UserRole.MANAGER)) {
      return left(new NotAllowedError())
    }

    const location = await this.locationsRepository.findById(locationId)

    if (!location) {
      return left(new ResourceNotFoundError())
    }

    await this.locationsRepository.delete(location)

    return right({})
  }
}
