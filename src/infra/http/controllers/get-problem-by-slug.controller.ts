import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger'
import { GetProblemBySlugUseCase } from '@/domain/maintenance-problems/application/use-cases/get-problem-by-slug'
import { AttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/attachments-repository'
import { ProblemHistoryRepository } from '@/domain/maintenance-problems/application/repositories/problem-history-repository'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { LocationsRepository } from '@/domain/maintenance-problems/application/repositories/locations-repository'
import { ProblemPresenter } from '../presenters/problem-presenter'
import { ProblemResponse } from '../dtos/interfaces.dto'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

@Controller('/problems/:slug')
@ApiTags('Problems')
@ApiExtraModels(ProblemResponse)
export class GetProblemBySlugController {
  constructor(
    private getProblemBySlug: GetProblemBySlugUseCase,
    private attachmentsRepository: AttachmentsRepository,
    private problemHistoryRepository: ProblemHistoryRepository,
    private usersRepository: UsersRepository,
    private locationsRepository: LocationsRepository,
  ) {}

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
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      }

      throw error
    }

    const problem = result.value.problem
    const attachments = await this.attachmentsRepository.findManyByProblemId(
      problem.id.toValue(),
    )
    const history = await this.problemHistoryRepository.findManyByProblemId(
      problem.id.toValue(),
    )
    const reporter = await this.usersRepository.findById(
      problem.reporterId.toValue(),
    )
    const location = await this.locationsRepository.findById(
      problem.locationId.toValue(),
    )

    if (!location) {
      throw new InternalServerErrorException(
        'Localização associada ao problema não encontrada',
      )
    }

    if (!reporter) {
      throw new InternalServerErrorException(
        'Autor associado ao problema não encontrado',
      )
    }

    return {
      problem: {
        ...ProblemPresenter.toHTTPWithAttachments(
          problem,
          attachments,
          {
            id: location.id.toValue(),
            name: location.name,
            code: location.code ?? '',
            description: location.description ?? '',
          },
          {
            id: reporter.id.toValue(),
            email: reporter.email,
          },
        ),
        history: ProblemPresenter.toHTTPHistory(history),
      },
    }
  }
}
