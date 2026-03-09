import {
  LocationsRepository,
  FetchLocationsParams,
} from '@/domain/maintenance-problems/application/repositories/locations-repository'
import { Location } from '@/domain/maintenance-problems/enterprise/entities/location'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaLocationMapper } from '../mappers/prisma-location-mapper'

@Injectable()
export class PrismaLocationsRepository implements LocationsRepository {
  constructor(private prisma: PrismaService) {}

  async findMany({
    page,
    query,
    isActive,
    includeDeleted,
  }: FetchLocationsParams): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: {
        purgedAt: null,
        ...(query && {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              code: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        }),
        ...(isActive !== undefined && { isActive }),
        ...(!includeDeleted && { deletedAt: null }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return locations.map(PrismaLocationMapper.toDomain)
  }

  async findById(id: string): Promise<Location | null> {
    const location = await this.prisma.location.findUnique({
      where: {
        id,
      },
    })

    if (!location) {
      return null
    }

    return PrismaLocationMapper.toDomain(location)
  }

  async findByName(name: string): Promise<Location | null> {
    const location = await this.prisma.location.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        deletedAt: null,
        purgedAt: null,
      },
    })

    if (!location) {
      return null
    }

    return PrismaLocationMapper.toDomain(location)
  }

  async create(location: Location): Promise<void> {
    const data = PrismaLocationMapper.toPrisma(location)

    await this.prisma.location.create({
      data,
    })
  }

  async save(location: Location): Promise<void> {
    const data = PrismaLocationMapper.toPrisma(location)

    await this.prisma.location.update({
      where: {
        id: location.id.toValue(),
      },
      data,
    })
  }

  async delete(location: Location): Promise<void> {
    await this.prisma.location.delete({
      where: {
        id: location.id.toValue(),
      },
    })
  }

  async hasAssociatedProblems(locationId: string): Promise<boolean> {
    const count = await this.prisma.problem.count({
      where: {
        locationId,
      },
    })

    return count > 0
  }
}
