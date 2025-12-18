import { BadRequestException, Controller, Get, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { GetProblemBySlugUseCase } from '@/domain/maintenance-problems/application/use-cases/get-problem-by-slug'
import { ProblemPresenter } from '../presenters/problem-presenter'
import { ProblemResponse } from '../dtos/interfaces.dto'

@Controller('/problems/:slug')
@ApiTags('Problems')
export class GetProblemBySlugController {
  constructor(private getProblemBySlug: GetProblemBySlugUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar problema por slug',
    description: 'Retorna um problema específico pelo seu slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug do problema',
    example: 'ar-condicionado-nao-funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'Problema encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        problem: { $ref: '#/components/schemas/ProblemResponse' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Slug inválido' })
  @ApiResponse({ status: 404, description: 'Problema não encontrado' })
  async handle(@Param('slug') slug: string) {
    const result = await this.getProblemBySlug.execute({
      slug,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return { problem: ProblemPresenter.toHTTP(result.value.problem) }
  }
}
