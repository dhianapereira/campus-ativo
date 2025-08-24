import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchLocationsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-locations'
import { LocationPresenter } from '../presenters/location-presenter'
import { LocationResponse } from '../dtos/interfaces.dto'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/locations')
@ApiTags('Locations')
export class FetchLocationsController {
  constructor(private fetchLocations: FetchLocationsUseCase) {}

  @Get()
  @ApiOperation({ 
    summary: 'Buscar localizações', 
    description: 'Retorna uma lista paginada de localizações disponíveis no sistema' 
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (começa em 1)',
    example: 1,
    type: Number
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de localizações retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          items: { $ref: '#/components/schemas/LocationResponse' }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  async handle(@Query('page', queryValidationPipe) page: PageQueryParamSchema) {
    const result = await this.fetchLocations.execute({ page })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const locations = result.value.locations

    return { locations: locations.map(LocationPresenter.toHTTP) }
  }
}
