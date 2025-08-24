import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { z } from "zod";
import { FetchProblemsUseCase } from "@/domain/maintenance-problems/application/use-cases/fetch-problems";
import { ProblemPresenter } from "../presenters/problem-presenter";

const pageQueryParamSchema = z
  .string()
  .optional()
  .default("1")
  .transform(Number)
  .pipe(z.number().min(1));

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema);

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>;

@Controller("/problems")
@ApiTags("Problems")
export class FetchProblemsController {
  constructor(private fetchProblems: FetchProblemsUseCase) {}

  @Get()
  @ApiOperation({
    summary: "Buscar problemas",
    description:
      "Retorna uma lista paginada de problemas reportados no sistema",
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
    description: "Lista de problemas retornada com sucesso",
    schema: {
      type: "object",
      properties: {
        problems: {
          type: "array",
          items: { $ref: "#/components/schemas/ProblemResponse" },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Parâmetros inválidos" })
  async handle(@Query("page", queryValidationPipe) page: PageQueryParamSchema) {
    const result = await this.fetchProblems.execute({ page });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const problems = result.value.problems;

    return { problems: problems.map(ProblemPresenter.toHTTP) };
  }
}
