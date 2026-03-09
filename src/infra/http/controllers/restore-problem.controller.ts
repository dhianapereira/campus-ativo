import {
  BadRequestException,
  Controller,
  ForbiddenException,
  HttpCode,
  Param,
  Patch,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { RestoreProblemFromTrashUseCase } from '@/domain/maintenance-problems/application/use-cases/restore-problem-from-trash'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/problems/:id/restore')
@ApiTags('Problems')
@ApiBearerAuth('JWT-auth')
export class RestoreProblemController {
  constructor(
    private readonly restoreProblemFromTrash: RestoreProblemFromTrashUseCase,
  ) {}

  @Patch()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Restaurar problema da lixeira',
    description:
      'Restaura um problema que estava na lixeira. Apenas o autor do problema pode restaurá-lo.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do problema a ser restaurado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Problema restaurado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Problema não encontrado' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão (apenas o autor pode restaurar)',
  })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') problemId: string,
  ) {
    const result = await this.restoreProblemFromTrash.execute({
      problemId,
      reporterId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new BadRequestException('Problem not found')
      }

      if (error instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Only the reporter can restore the problem from trash',
        )
      }

      throw new BadRequestException()
    }
  }
}
