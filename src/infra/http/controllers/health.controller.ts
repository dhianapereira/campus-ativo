import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '@/infra/auth/public'

@Controller('/health')
@ApiTags('Health')
@Public()
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Verificar saúde da aplicação',
    description: 'Retorna o status básico da API para uso em health checks',
  })
  @ApiResponse({ status: 200, description: 'Aplicação saudável' })
  handle() {
    return { status: 'ok' }
  }
}
