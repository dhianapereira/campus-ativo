import { PaginationParams } from "@/core/repositories/pagination-params";
import { CategoriesRepository } from "@/domain/maintenance-problems/application/repositories/categories-repository";
import { Category } from "@/domain/maintenance-problems/enterprise/entities/category";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PrismaCategoryMapper } from "../mappers/prisma-category-mapper";

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async findMany({ page }: PaginationParams): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      skip: (page - 1) * 20,
    });

    return categories.map(PrismaCategoryMapper.toDomain);
  }

  async create(category: Category): Promise<void> {
    const data = PrismaCategoryMapper.toPrisma(category);

    await this.prisma.category.create({
      data,
    });
  }
}
