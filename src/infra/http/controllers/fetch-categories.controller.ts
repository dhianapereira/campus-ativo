import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchCategoriesUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-categories'
import { CategoryPresenter } from '../presenters/category-presenter'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'

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

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)
const pageSizeValidationPipe = new ZodValidationPipe(pageSizeQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>
type PageSizeQueryParamSchema = z.infer<typeof pageSizeQueryParamSchema>

const querySearchParamSchema = z.string().optional()
const isActiveQueryParamSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined
    return val === 'true'
  })
const includeDeletedQueryParamSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined
    return val === 'true'
  })

const querySearchValidationPipe = new ZodValidationPipe(querySearchParamSchema)
const isActiveValidationPipe = new ZodValidationPipe(isActiveQueryParamSchema)
const includeDeletedValidationPipe = new ZodValidationPipe(
  includeDeletedQueryParamSchema,
)

type QuerySearchParamSchema = z.infer<typeof querySearchParamSchema>
type IsActiveQueryParamSchema = z.infer<typeof isActiveQueryParamSchema>
type IncludeDeletedQueryParamSchema = z.infer<
  typeof includeDeletedQueryParamSchema
>

@Controller('/categories')
@ApiTags('Categories')
export class FetchCategoriesController {
  constructor(private fetchCategories: FetchCategoriesUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar categorias',
    description:
      'Retorna uma lista paginada de categorias de problemas disponíveis no sistema',
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
    description: 'Busca por nome ou descrição',
    example: 'Climatização',
    type: String,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filtrar por status ativo/inativo',
    example: true,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: 'Incluir categorias deletadas (na lixeira)',
    example: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { $ref: '#/components/schemas/CategoryResponse' },
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
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para listar itens deletados',
  })
  async handle(
    @CurrentUser() user: UserPayload,
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @Query('pageSize', pageSizeValidationPipe)
    pageSize: PageSizeQueryParamSchema,
    @Query('query', querySearchValidationPipe) query: QuerySearchParamSchema,
    @Query('isActive', isActiveValidationPipe)
    isActive: IsActiveQueryParamSchema,
    @Query('includeDeleted', includeDeletedValidationPipe)
    includeDeleted: IncludeDeletedQueryParamSchema,
  ) {
    const result = await this.fetchCategories.execute({
      page,
      query,
      isActive,
      includeDeleted,
      pageSize,
      userRole: (user.role as UserRole) || UserRole.REPORTER,
    })

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(result.value.message)
      }

      throw new BadRequestException()
    }

    const { categories, total } = result.value

    return {
      categories: categories.map(CategoryPresenter.toHTTP),
      total,
      page,
      pageSize,
    }
  }
}
