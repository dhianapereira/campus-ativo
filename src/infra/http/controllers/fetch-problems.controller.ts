import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchProblemsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-problems'
import { ProblemPresenter } from '../presenters/problem-presenter'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ProblemWithDetailsResponse } from '../dtos/interfaces.dto'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryQueryParamSchema = z.string().optional()

const includeDeletedQueryParamSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined
    return val === 'true'
  })

const pageValidationPipe = new ZodValidationPipe(pageQueryParamSchema)
const queryValidationPipe = new ZodValidationPipe(queryQueryParamSchema)
const includeDeletedValidationPipe = new ZodValidationPipe(
  includeDeletedQueryParamSchema,
)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>
type QueryQueryParamSchema = z.infer<typeof queryQueryParamSchema>
type IncludeDeletedQueryParamSchema = z.infer<
  typeof includeDeletedQueryParamSchema
>

@Controller('/problems')
@ApiTags('Problems')
@ApiExtraModels(ProblemWithDetailsResponse)
export class FetchProblemsController {
  constructor(private fetchProblems: FetchProblemsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar problemas',
    description:
      'Retorna uma lista paginada de problemas reportados no sistema com informações de localização',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (começa em 1)',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description:
      'Termo de busca para filtrar problemas por título ou descrição',
    example: 'ar condicionado',
    type: String,
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: 'Incluir problemas deletados (na lixeira)',
    example: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de problemas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        problems: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProblemWithDetailsResponse' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  async handle(
    @CurrentUser() user: UserPayload,
    @Query('page', pageValidationPipe) page: PageQueryParamSchema,
    @Query('query', queryValidationPipe) query: QueryQueryParamSchema,
    @Query('includeDeleted', includeDeletedValidationPipe)
    includeDeleted: IncludeDeletedQueryParamSchema,
  ) {
    const reporterIdFilter = includeDeleted && user.sub
      ? user.sub
      : undefined

    if (includeDeleted && !user.sub) {
      throw new ForbiddenException('Unable to identify current user')
    }

    const result = await this.fetchProblems.execute({
      page,
      query,
      includeDeleted,
      reporterId: reporterIdFilter,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const problems = result.value.problems

    return { problems: problems.map(ProblemPresenter.toHTTPWithDetails) }
  }
}
