import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

@Controller('/sessions')
@ApiTags('Authentication')
@UseGuards(JwtAuthGuard)
export class LogoutController {
  @Post('/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Logout do usuário',
    description:
      'Realiza logout do usuário (token deve ser removido no cliente)',
  })
  @ApiResponse({
    status: 204,
    description: 'Logout realizado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou não fornecido',
  })
  async handle() {
    // Currently, we rely on client-side token removal
    // In a production environment, you might want to implement:
    // 1. Token blacklist with Redis
    // 2. Short-lived tokens with refresh token rotation
    // 3. Token versioning in user entity
  }
}
