import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { TrashLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/trash-location'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/locations/:id/trash')
@ApiTags('Locations')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class TrashLocationController {
  constructor(private readonly trashLocation: TrashLocationUseCase) {}

  @Patch()
  @HttpCode(204)
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Mover localização para lixeira',
    description:
      'Move uma localização para a lixeira (soft delete, requer role MANAGER+)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da localização a ser movida para lixeira',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Localização movida para lixeira com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Localização não encontrada' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão (requer MANAGER+)',
  })
  @ApiResponse({ status: 404, description: 'Localização não encontrada' })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') locationId: string,
  ) {
    const result = await this.trashLocation.execute({
      locationId,
      userRole: user.role as UserRole,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new BadRequestException('Location not found')
      }

      throw new BadRequestException()
    }
  }
}
