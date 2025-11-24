import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { RegisterUserUseCase } from '@/domain/accounts/application/use-cases/register-user'
import { UserAlreadyExistsError } from '@/domain/accounts/application/use-cases/errors/user-already-exists-error'
import { InvalidEmailDomainError } from '@/domain/accounts/application/use-cases/errors/invalid-email-domain-error'
import { InvalidPasswordError } from '@/domain/accounts/application/use-cases/errors/invalid-password-error'
import { Public } from '@/infra/auth/public'
import { CreateAccountRequest } from '../dtos/interfaces.dto'

const createAccountBodySchema = z.object({
  name: z.string(),
  position: z.string(),
  email: z.string().email(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
@ApiTags('Authentication')
@Public()
export class CreateAccountController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post()
  @ApiOperation({
    summary: 'Criar conta',
    description: 'Cria uma nova conta de usuário no sistema',
  })
  @ApiBody({ type: CreateAccountRequest })
  @ApiResponse({
    status: 201,
    description: 'Conta criada com sucesso',
  })
  @ApiResponse({ status: 409, description: 'Email já existe no sistema' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou domínio de email não permitido',
  })
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    const { name, position, email, password } = body

    const result = await this.registerUser.execute({
      name,
      position,
      email,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case UserAlreadyExistsError:
          throw new ConflictException(error.message)
        case InvalidEmailDomainError:
        case InvalidPasswordError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
