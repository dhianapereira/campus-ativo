import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { DeleteLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-location'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/locations/:id')
@ApiTags('Locations')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class DeleteLocationController {
  constructor(private readonly deleteLocation: DeleteLocationUseCase) {}

  @Delete()
  @HttpCode(204)
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Deletar localização',
    description: 'Deleta permanentemente uma localização do sistema (requer role MANAGER+)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da localização a ser deletada',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 204,
    description: 'Localização deletada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Localização não encontrada' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({ status: 403, description: 'Usuário não tem permissão (requer MANAGER+)' })
  @ApiResponse({ status: 404, description: 'Localização não encontrada' })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') locationId: string,
  ) {
    const result = await this.deleteLocation.execute({
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
