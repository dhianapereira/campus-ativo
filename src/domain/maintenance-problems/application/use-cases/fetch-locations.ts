import { right, Either } from "@/core/either";
import { Injectable } from "@nestjs/common";
import { Location } from "../../enterprise/entities/location";
import { LocationsRepository } from "../repositories/locations-repository";

interface FetchLocationsUseCaseRequest {
  page: number;
}

type FetchLocationsUseCaseResponse = Either<
  null,
  {
    locations: Location[];
  }
>;

@Injectable()
export class FetchLocationsUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute({
    page,
  }: FetchLocationsUseCaseRequest): Promise<FetchLocationsUseCaseResponse> {
    const locations = await this.locationsRepository.findMany({ page });

    return right({
      locations,
    });
  }
}
