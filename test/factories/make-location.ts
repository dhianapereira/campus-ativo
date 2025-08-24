import { faker } from "@faker-js/faker";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  Location,
  LocationProps,
} from "@/domain/maintenance-problems/enterprise/entities/location";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { PrismaLocationMapper } from "@/infra/database/prisma/mappers/prisma-location-mapper";

export function makeLocation(
  override: Partial<LocationProps> = {},
  id?: UniqueEntityID,
) {
  const location = Location.create(
    {
      name: faker.lorem.sentence(),
      description: faker.lorem.text(),
      code: faker.string.uuid(),
      isActive: true,
      ...override,
    },
    id,
  );

  return location;
}

@Injectable()
export class LocationFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaLocation(
    data: Partial<LocationProps> = {},
  ): Promise<Location> {
    const location = makeLocation(data);

    await this.prisma.location.create({
      data: PrismaLocationMapper.toPrisma(location),
    });

    return location;
  }
}
