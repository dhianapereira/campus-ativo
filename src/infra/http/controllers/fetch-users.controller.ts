import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger'
import { FetchUsersUseCase } from '@/domain/accounts/application/use-cases/fetch-users'
import { UserListPresenter } from '../presenters/user-list-presenter'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/users')
@ApiTags('User Management')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class FetchUsersController {
  constructor(private readonly fetchUsers: FetchUsersUseCase) {}

  @Get()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Listar usuários',
    description:
      'Lista todos os usuários do sistema com filtros baseados no role do usuário autenticado. ADMIN pode ver todos os usuários, DIRECTOR e abaixo não veem usuários ADMIN.',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Termo de busca para filtrar usuários por nome ou email',
    type: String,
    example: 'João',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description:
      'Filtrar usuários por status (true para ativos, false para inativos)',
    type: Boolean,
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614174000',
              },
              name: { type: 'string', example: 'João Silva' },
              email: { type: 'string', example: 'joao.silva@ifal.edu.br' },
              position: { type: 'string', example: 'Técnico em Informática' },
              role: {
                type: 'string',
                enum: ['REPORTER', 'MANAGER', 'DIRECTOR', 'ADMIN'],
                example: 'REPORTER',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão (requer DIRECTOR+)',
  })
  async handle(
    @CurrentUser() user: UserPayload,
    @Query('query') query?: string,
    @Query('isActive') isActive?: string,
  ) {
    const currentUserRole = (user.role as UserRole) || UserRole.REPORTER

    const result = await this.fetchUsers.execute({
      currentUserRole,
      query,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return {
      users: result.value.users.map(UserListPresenter.toHTTP),
    }
  }
}
