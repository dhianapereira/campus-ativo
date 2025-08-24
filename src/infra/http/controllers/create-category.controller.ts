import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { z } from "zod";
import { CreateCategoryUseCase } from "@/domain/maintenance-problems/application/use-cases/create-category";
import { RolesGuard } from "@/infra/auth/roles.guard";
import { Roles } from "@/infra/auth/roles.decorator";
import { UserRole } from "@/domain/accounts/enterprise/entities/user";
import { CreateCategoryRequest } from "../dtos/interfaces.dto";

const createCategoryBodySchema = z.object({
  name: z.string(),
  description: z.string(),
});

const bodyValidationPipe = new ZodValidationPipe(createCategoryBodySchema);

type CreateCategoryBodySchema = z.infer<typeof createCategoryBodySchema>;

@Controller("/categories")
@ApiTags("Categories")
@ApiBearerAuth("JWT-auth")
@UseGuards(RolesGuard)
export class CreateCategoryController {
  constructor(private readonly createCategory: CreateCategoryUseCase) {}

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: "Criar categoria",
    description: "Cria uma nova categoria de problema (requer role MANAGER+)",
  })
  @ApiBody({ type: CreateCategoryRequest })
  @ApiResponse({
    status: 201,
    description: "Categoria criada com sucesso",
  })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 401, description: "Token JWT inválido ou expirado" })
  @ApiResponse({
    status: 403,
    description: "Usuário não tem permissão (requer MANAGER+)",
  })
  async handle(@Body(bodyValidationPipe) body: CreateCategoryBodySchema) {
    const { name, description } = body;

    const result = await this.createCategory.execute({
      name,
      description,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
