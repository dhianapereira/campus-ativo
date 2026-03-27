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
import { ProblemStatus } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const pageSizeQueryParamSchema = z
  .string()
  .optional()
  .default('20')
  .transform(Number)
  .pipe(z.number().min(1).max(100))

const queryQueryParamSchema = z.string().optional()

const statusesQueryParamSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined

    const statuses = val
      .split(',')
      .map((status) => status.trim())
      .filter(Boolean)

    if (statuses.length === 0) return undefined

    return z.array(z.nativeEnum(ProblemStatus)).parse(statuses)
  })

const includeDeletedQueryParamSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined
    return val === 'true'
  })

const pageValidationPipe = new ZodValidationPipe(pageQueryParamSchema)
const pageSizeValidationPipe = new ZodValidationPipe(pageSizeQueryParamSchema)
const queryValidationPipe = new ZodValidationPipe(queryQueryParamSchema)
const statusesValidationPipe = new ZodValidationPipe(statusesQueryParamSchema)
const includeDeletedValidationPipe = new ZodValidationPipe(
  includeDeletedQueryParamSchema,
)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>
type PageSizeQueryParamSchema = z.infer<typeof pageSizeQueryParamSchema>
type QueryQueryParamSchema = z.infer<typeof queryQueryParamSchema>
type StatusesQueryParamSchema = z.infer<typeof statusesQueryParamSchema>
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
    name: 'pageSize',
    required: false,
    description: 'Quantidade de itens por página',
    example: 20,
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
    name: 'statuses',
    required: false,
    description: 'Lista de status separada por vírgula para filtrar problemas',
    example: 'TO_ANALYSIS,IN_PROGRESS',
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
        total: {
          type: 'number',
          example: 42,
        },
        page: {
          type: 'number',
          example: 1,
        },
        pageSize: {
          type: 'number',
          example: 20,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  async handle(
    @CurrentUser() user: UserPayload,
    @Query('page', pageValidationPipe) page: PageQueryParamSchema,
    @Query('pageSize', pageSizeValidationPipe)
    pageSize: PageSizeQueryParamSchema,
    @Query('query', queryValidationPipe) query: QueryQueryParamSchema,
    @Query('statuses', statusesValidationPipe)
    statuses: StatusesQueryParamSchema,
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
      pageSize,
      query,
      statuses,
      includeDeleted,
      reporterId: reporterIdFilter,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const { problems, total } = result.value

    return {
      problems: problems.map(ProblemPresenter.toHTTPWithDetails),
      total,
      page,
      pageSize,
    }
  }
}
