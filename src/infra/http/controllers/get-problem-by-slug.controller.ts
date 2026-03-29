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
import { CategoriesRepository } from '@/domain/maintenance-problems/application/repositories/categories-repository'
import { ProblemPresenter } from '../presenters/problem-presenter'
import { ProblemResponse } from '../dtos/interfaces.dto'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { AttachmentUrlResolver } from '@/domain/maintenance-problems/application/upload/attachment-url-resolver'

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
    private categoriesRepository: CategoriesRepository,
    private attachmentUrlResolver: AttachmentUrlResolver,
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
    const presentedAttachments = await Promise.all(
      attachments.map(async (attachment) => ({
        id: attachment.id.toValue(),
        title: attachment.title,
        url: await this.attachmentUrlResolver.resolve(attachment.link),
      })),
    )
    const history = await this.problemHistoryRepository.findManyByProblemId(
      problem.id.toValue(),
    )
    const historyUsers = await this.usersRepository.findManyByIds([
      ...new Set(history.map((entry) => entry.userId.toValue())),
    ])
    const historyUserNames = new Map(
      historyUsers.map((user) => [user.id.toValue(), user.name]),
    )
    const reporter = await this.usersRepository.findById(
      problem.reporterId.toValue(),
    )
    const location = await this.locationsRepository.findById(
      problem.locationId.toValue(),
    )
    const category = await this.categoriesRepository.findById(
      problem.categoryId.toValue(),
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

    if (!category) {
      throw new InternalServerErrorException(
        'Categoria associada ao problema não encontrada',
      )
    }

    return {
      problem: {
        ...ProblemPresenter.toHTTPWithAttachments(
          problem,
          presentedAttachments,
          {
            id: category.id.toValue(),
            name: category.name,
            description: category.description ?? null,
          },
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
        history: ProblemPresenter.toHTTPHistory(
          history,
          (userId) => historyUserNames.get(userId) ?? 'Usuário não encontrado',
        ),
      },
    }
  }
}
