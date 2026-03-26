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
import { EditCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/edit-category'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CategoryInTrashError } from '@/core/errors/category-in-trash-error'
import { EditCategoryRequest } from '../dtos/interfaces.dto'
import { CategoriesRepository } from '@/domain/maintenance-problems/application/repositories/categories-repository'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

const editCategoryBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editCategoryBodySchema)

type EditCategoryBodySchema = z.infer<typeof editCategoryBodySchema>

@Controller('/categories/:id')
@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class EditCategoryController {
  constructor(
    private readonly editCategory: EditCategoryUseCase,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  @Patch()
  @HttpCode(204)
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Editar categoria',
    description: 'Edita uma categoria existente (requer role MANAGER+)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria a ser editada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: EditCategoryRequest })
  @ApiResponse({
    status: 204,
    description: 'Categoria editada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou categoria na lixeira',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão (requer MANAGER+)',
  })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: EditCategoryBodySchema,
    @Param('id') categoryId: string,
  ) {
    const { name, description, isActive } = body

    if (
      name === undefined &&
      description === undefined &&
      isActive === undefined
    ) {
      throw new BadRequestException('At least one field must be provided')
    }

    let categoryName = name
    if (!categoryName) {
      const existingCategory =
        await this.categoriesRepository.findById(categoryId)
      if (!existingCategory) {
        throw new BadRequestException('Category not found')
      }
      categoryName = existingCategory.name
    }

    const result = await this.editCategory.execute({
      categoryId,
      userRole: user.role as UserRole,
      name: categoryName,
      description,
      isActive,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new BadRequestException('Category not found')
      }

      if (error instanceof CategoryInTrashError) {
        throw new BadRequestException('Cannot edit category in trash')
      }

      throw new BadRequestException()
    }
  }
}
