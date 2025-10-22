import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchProblemsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-problems'
import { ProblemPresenter } from '../presenters/problem-presenter'
import { ProblemWithDetailsResponse } from '../dtos/interfaces.dto'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryQueryParamSchema = z.string().optional()

const pageValidationPipe = new ZodValidationPipe(pageQueryParamSchema)
const queryValidationPipe = new ZodValidationPipe(queryQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>
type QueryQueryParamSchema = z.infer<typeof queryQueryParamSchema>

@Controller('/problems')
@ApiTags('Problems')
export class FetchProblemsController {
  constructor(private fetchProblems: FetchProblemsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar problemas',
    description: 'Retorna uma lista paginada de problemas reportados no sistema com informações de localização'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (começa em 1)',
    example: 1,
    type: Number
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Termo de busca para filtrar problemas por título ou descrição',
    example: 'ar condicionado',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de problemas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        problems: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProblemWithDetailsResponse' }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  async handle(
    @Query('page', pageValidationPipe) page: PageQueryParamSchema,
    @Query('query', queryValidationPipe) query: QueryQueryParamSchema,
  ) {
    const result = await this.fetchProblems.execute({ page, query })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const problems = result.value.problems

    return { problems: problems.map(ProblemPresenter.toHTTPWithDetails) }
  }
}
