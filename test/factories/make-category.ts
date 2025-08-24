import { faker } from "@faker-js/faker";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  Category,
  CategoryProps,
} from "@/domain/maintenance-problems/enterprise/entities/category";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { PrismaCategoryMapper } from "@/infra/database/prisma/mappers/prisma-category-mapper";

export function makeCategory(
  override: Partial<CategoryProps> = {},
  id?: UniqueEntityID,
) {
  const category = Category.create(
    {
      name: faker.lorem.sentence(),
      description: faker.lorem.text(),
      isActive: true,
      ...override,
    },
    id,
  );

  return category;
}

@Injectable()
export class CategoryFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaCategory(
    data: Partial<CategoryProps> = {},
  ): Promise<Category> {
    const category = makeCategory(data);

    await this.prisma.category.create({
      data: PrismaCategoryMapper.toPrisma(category),
    });

    return category;
  }
}
