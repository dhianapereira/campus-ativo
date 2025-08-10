import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { AuthenticateUserUseCase } from '@/domain/accounts/application/use-cases/authenticate-user'
import { WrongCredentialsError } from '@/domain/accounts/application/use-cases/errors/wrong-credentials-error'
import { Public } from '@/infra/auth/public'
import { AuthenticateRequest, AuthenticateResponse } from '../dtos/interfaces.dto'

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
@ApiTags('Authentication')
@Public()
export class AuthenticateController {
  constructor(
    private readonly authenticateUser: AuthenticateUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Autenticar usuário', description: 'Autentica um usuário e retorna um token JWT' })
  @ApiBody({ type: AuthenticateRequest })
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso',
    type: AuthenticateResponse,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { email, password } = body

    const result = await this.authenticateUser.execute({
      email,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { accessToken } = result.value

    return { access_token: accessToken }
  }
}
