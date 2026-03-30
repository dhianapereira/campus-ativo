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
import { MoveProblemToTrashUseCase } from '@/domain/maintenance-problems/application/use-cases/move-problem-to-trash'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ProblemNotDeletableError } from '@/core/errors/problem-not-deletable-error'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  PROBLEM_NOT_DELETABLE_MESSAGE,
  PROBLEM_NOT_FOUND_MESSAGE,
  PROBLEM_TRASH_FORBIDDEN_MESSAGE,
} from './controller-error-messages'

@Controller('/problems/:id/trash')
@ApiTags('Problems')
@ApiBearerAuth('JWT-auth')
export class TrashProblemController {
  constructor(private readonly moveProblemToTrash: MoveProblemToTrashUseCase) {}

  @Patch()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Mover problema para lixeira',
    description:
      'Move um problema para a lixeira (soft delete). Apenas o autor do problema pode movê-lo para a lixeira e somente quando o status for TO_ANALYSIS.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do problema a ser movido para lixeira',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Problema movido para lixeira com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Problema não encontrado ou não pode ser deletado',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({
    status: 403,
    description:
      'Usuário não tem permissão (apenas o autor pode mover para lixeira)',
  })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') problemId: string,
  ) {
    const result = await this.moveProblemToTrash.execute({
      problemId,
      reporterId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new BadRequestException(PROBLEM_NOT_FOUND_MESSAGE)
      }

      if (error instanceof NotAllowedError) {
        throw new ForbiddenException(PROBLEM_TRASH_FORBIDDEN_MESSAGE)
      }

      if (error instanceof ProblemNotDeletableError) {
        throw new BadRequestException(PROBLEM_NOT_DELETABLE_MESSAGE)
      }

      throw new BadRequestException(PROBLEM_NOT_DELETABLE_MESSAGE)
    }
  }
}
