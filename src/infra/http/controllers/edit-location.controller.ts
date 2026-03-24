import {
  BadRequestException,
  Body,
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
  ApiBody,
  ApiParam,
} from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { EditLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/edit-location'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { LocationInTrashError } from '@/core/errors/location-in-trash-error'
import { EditLocationRequest } from '../dtos/interfaces.dto'
import { LocationsRepository } from '@/domain/maintenance-problems/application/repositories/locations-repository'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

const editLocationBodySchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editLocationBodySchema)

type EditLocationBodySchema = z.infer<typeof editLocationBodySchema>

@Controller('/locations/:id')
@ApiTags('Locations')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class EditLocationController {
  constructor(
    private readonly editLocation: EditLocationUseCase,
    private readonly locationsRepository: LocationsRepository,
  ) {}

  @Patch()
  @HttpCode(204)
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Editar localização',
    description: 'Edita uma localização existente (requer role MANAGER+)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da localização a ser editada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: EditLocationRequest })
  @ApiResponse({
    status: 204,
    description: 'Localização editada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou localização na lixeira',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão (requer MANAGER+)',
  })
  @ApiResponse({ status: 404, description: 'Localização não encontrada' })
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: EditLocationBodySchema,
    @Param('id') locationId: string,
  ) {
    const { name, code, description, isActive } = body

    // At least one field must be provided
    if (
      name === undefined &&
      code === undefined &&
      description === undefined &&
      isActive === undefined
    ) {
      throw new BadRequestException('At least one field must be provided')
    }

    // Get existing location to preserve unmodified fields
    const existingLocation = await this.locationsRepository.findById(locationId)
    if (!existingLocation) {
      throw new BadRequestException('Location not found')
    }

    const result = await this.editLocation.execute({
      locationId,
      name: name ?? existingLocation.name,
      code: code !== undefined
        ? code
        : existingLocation.code,
      description:
        description !== undefined
          ? description
          : existingLocation.description,
      isActive: isActive ?? existingLocation.isActive,
      userRole: user.role as UserRole,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new BadRequestException('Location not found')
      }

      if (error instanceof LocationInTrashError) {
        throw new BadRequestException('Cannot edit location in trash')
      }

      throw new BadRequestException()
    }
  }
}
