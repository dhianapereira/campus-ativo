import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/create-location'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { CreateLocationRequest } from '../dtos/interfaces.dto'

const createLocationBodySchema = z.object({
  name: z.string(),
  description: z.string(),
  code: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(createLocationBodySchema)

type CreateLocationBodySchema = z.infer<typeof createLocationBodySchema>

@Controller('/locations')
@ApiTags('Locations')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class CreateLocationController {
  constructor(private readonly createLocation: CreateLocationUseCase) {}

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Criar localização', 
    description: 'Cria uma nova localização no sistema (requer role MANAGER+)' 
  })
  @ApiBody({ type: CreateLocationRequest })
  @ApiResponse({ 
    status: 201, 
    description: 'Localização criada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({ status: 403, description: 'Usuário não tem permissão (requer MANAGER+)' })
  async handle(@Body(bodyValidationPipe) body: CreateLocationBodySchema) {
    const { name, description, code } = body

    const result = await this.createLocation.execute({
      name,
      description,
      code,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
