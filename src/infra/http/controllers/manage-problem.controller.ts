import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ManageProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/manage-problem'
import {
  MaintenanceType,
  ProblemStatus,
} from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ManageProblemRequest } from '../dtos/interfaces.dto'

const manageProblemBodySchema = z.object({
  status: z.nativeEnum(ProblemStatus).optional(),
  categoryId: z.string().optional(),
  maintenanceType: z.nativeEnum(MaintenanceType).optional(),
  note: z.string().optional(),
})

type ManageProblemBodySchema = z.infer<typeof manageProblemBodySchema>

@Controller('/problems/:id')
@ApiTags('Problems')
@ApiBearerAuth('JWT-auth')
export class ManageProblemController {
  constructor(private readonly manageProblem: ManageProblemUseCase) {}

  @Patch()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Gerenciar problema',
    description:
      'Atualiza status, categoria, tipo de manutenção e adiciona observações ao histórico do problema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do problema a ser gerenciado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: ManageProblemRequest })
  @ApiResponse({
    status: 204,
    description: 'Problema gerenciado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para esta operação',
  })
  @ApiResponse({ status: 404, description: 'Problema não encontrado' })
  async handle(
    @Param('id') problemId: string,
    @Body(new ZodValidationPipe(manageProblemBodySchema))
    body: ManageProblemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const executorRole = (user.role as UserRole) || UserRole.REPORTER

    const result = await this.manageProblem.execute({
      problemId,
      executorId: user.sub,
      executorRole,
      status: body.status,
      categoryId: body.categoryId,
      maintenanceType: body.maintenanceType,
      note: body.note,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
