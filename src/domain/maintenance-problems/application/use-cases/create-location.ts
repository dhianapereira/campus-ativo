import { Location } from '@/domain/maintenance-problems/enterprise/entities/location'
import { right, Either } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { LocationsRepository } from '../repositories/locations-repository'

interface CreateLocationUseCaseRequest {
  name: string
  description?: string | null
  code?: string | null
}

type CreateLocationUseCaseResponse = Either<
  null,
  {
    location: Location
  }
>

@Injectable()
export class CreateLocationUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute({
    name,
    description,
    code,
  }: CreateLocationUseCaseRequest): Promise<CreateLocationUseCaseResponse> {
    const location = Location.create({
      name,
      description,
      code,
    })

    await this.locationsRepository.create(location)

    return right({
      location,
    })
  }
}
