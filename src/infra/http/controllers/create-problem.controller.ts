import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";

import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { z } from "zod";
import { CreateProblemUseCase } from "@/domain/maintenance-problems/application/use-cases/create-problem";
import { CreateProblemRequest } from "../dtos/interfaces.dto";

const createProblemBodySchema = z.object({
  title: z.string(),
  description: z.string(),
  locationId: z.string(),
  categoryId: z.string(),
});

const bodyValidationPipe = new ZodValidationPipe(createProblemBodySchema);

type CreateProblemBodySchema = z.infer<typeof createProblemBodySchema>;

@Controller("/problems")
@ApiTags("Problems")
@ApiBearerAuth("JWT-auth")
export class CreateProblemController {
  constructor(private readonly createProblem: CreateProblemUseCase) {}

  @Post()
  @ApiOperation({
    summary: "Criar problema",
    description: "Cria um novo problema de infraestrutura",
  })
  @ApiBody({ type: CreateProblemRequest })
  @ApiResponse({
    status: 201,
    description: "Problema criado com sucesso",
  })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 401, description: "Token JWT inválido ou expirado" })
  async handle(
    @Body(bodyValidationPipe) body: CreateProblemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { title, description, locationId, categoryId } = body;
    const userId = user.sub;

    const result = await this.createProblem.execute({
      title,
      description,
      locationId,
      categoryId,
      reporterId: userId,
      attachmentsIds: [],
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
