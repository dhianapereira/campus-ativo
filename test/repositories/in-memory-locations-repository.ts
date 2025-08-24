import { PaginationParams } from "@/core/repositories/pagination-params";
import { LocationsRepository } from "@/domain/maintenance-problems/application/repositories/locations-repository";
import { Location } from "@/domain/maintenance-problems/enterprise/entities/location";

export class InMemoryLocationsRepository implements LocationsRepository {
  public items: Location[] = [];

  async findMany({ page }: PaginationParams) {
    const locations = this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20);

    return locations;
  }

  async create(location: Location) {
    this.items.push(location);
  }
}
