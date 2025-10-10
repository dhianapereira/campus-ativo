import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { RestoreLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/restore-location'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/locations/:id/restore')
@ApiTags('Locations')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class RestoreLocationController {
  constructor(private readonly restoreLocation: RestoreLocationUseCase) {}

  @Patch()
  @HttpCode(204)
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Restaurar localização da lixeira',
    description: 'Restaura uma localização que estava na lixeira (requer role MANAGER+)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da localização a ser restaurada',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 204,
    description: 'Localização restaurada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Localização não encontrada' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({ status: 403, description: 'Usuário não tem permissão (requer MANAGER+)' })
  @ApiResponse({ status: 404, description: 'Localização não encontrada' })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') locationId: string,
  ) {
    const result = await this.restoreLocation.execute({
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
