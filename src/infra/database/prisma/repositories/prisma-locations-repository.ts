import { PaginationParams } from '@/core/repositories/pagination-params'
import { LocationsRepository } from '@/domain/maintenance-problems/application/repositories/locations-repository'
import { Location } from '@/domain/maintenance-problems/enterprise/entities/location'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaLocationMapper } from '../mappers/prisma-location-mapper'

@Injectable()
export class PrismaLocationsRepository implements LocationsRepository {
  constructor(private prisma: PrismaService) {}

  async findMany({ page }: PaginationParams): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return locations.map(PrismaLocationMapper.toDomain)
  }

  async create(location: Location): Promise<void> {
    const data = PrismaLocationMapper.toPrisma(location)

    await this.prisma.location.create({
      data,
    })
  }
}
