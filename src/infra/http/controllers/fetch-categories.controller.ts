import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { z } from "zod";
import { FetchCategoriesUseCase } from "@/domain/maintenance-problems/application/use-cases/fetch-categories";
import { CategoryPresenter } from "../presenters/category-presenter";

const pageQueryParamSchema = z
  .string()
  .optional()
  .default("1")
  .transform(Number)
  .pipe(z.number().min(1));

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema);

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>;

@Controller("/categories")
@ApiTags("Categories")
export class FetchCategoriesController {
  constructor(private fetchCategories: FetchCategoriesUseCase) {}

  @Get()
  @ApiOperation({
    summary: "Buscar categorias",
    description:
      "Retorna uma lista paginada de categorias de problemas disponíveis no sistema",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Número da página (começa em 1)",
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Lista de categorias retornada com sucesso",
    schema: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: { $ref: "#/components/schemas/CategoryResponse" },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Parâmetros inválidos" })
  async handle(@Query("page", queryValidationPipe) page: PageQueryParamSchema) {
    const result = await this.fetchCategories.execute({ page });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const categories = result.value.categories;

    return { categories: categories.map(CategoryPresenter.toHTTP) };
  }
}
