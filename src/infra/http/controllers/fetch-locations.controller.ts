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
import { FetchLocationsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-locations'
import { LocationPresenter } from '../presenters/location-presenter'
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

const queryQueryParamSchema = z.string().optional()

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

const pageValidationPipe = new ZodValidationPipe(pageQueryParamSchema)
const queryValidationPipe = new ZodValidationPipe(queryQueryParamSchema)
const isActiveValidationPipe = new ZodValidationPipe(isActiveQueryParamSchema)
const includeDeletedValidationPipe = new ZodValidationPipe(
  includeDeletedQueryParamSchema,
)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>
type QueryQueryParamSchema = z.infer<typeof queryQueryParamSchema>
type IsActiveQueryParamSchema = z.infer<typeof isActiveQueryParamSchema>
type IncludeDeletedQueryParamSchema = z.infer<
  typeof includeDeletedQueryParamSchema
>

@Controller('/locations')
@ApiTags('Locations')
export class FetchLocationsController {
  constructor(private fetchLocations: FetchLocationsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar localizações',
    description:
      'Retorna uma lista paginada de localizações disponíveis no sistema',
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
      'Termo de busca para filtrar localizações por nome, código ou descrição',
    example: 'Bloco A',
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
    description: 'Incluir localizações deletadas (na lixeira)',
    example: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de localizações retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          items: { $ref: '#/components/schemas/LocationResponse' },
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
    @Query('page', pageValidationPipe) page: PageQueryParamSchema,
    @Query('query', queryValidationPipe) query: QueryQueryParamSchema,
    @Query('isActive', isActiveValidationPipe)
    isActive: IsActiveQueryParamSchema,
    @Query('includeDeleted', includeDeletedValidationPipe)
    includeDeleted: IncludeDeletedQueryParamSchema,
  ) {
    const result = await this.fetchLocations.execute({
      page,
      query,
      isActive,
      includeDeleted,
      userRole: (user.role as UserRole) || UserRole.REPORTER,
    })

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(result.value.message)
      }

      throw new BadRequestException()
    }

    const locations = result.value.locations

    return { locations: locations.map(LocationPresenter.toHTTP) }
  }
}
