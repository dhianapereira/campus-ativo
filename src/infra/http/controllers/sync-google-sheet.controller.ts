import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { SyncProblemsFromGoogleSheetUseCase } from '@/domain/maintenance-problems/application/use-cases/sync-problems-from-google-sheet'

const syncGoogleSheetBodySchema = z.object({
  spreadsheetId: z.string().min(1, 'ID da planilha é obrigatório'),
  sheetName: z.string().optional().default('Formulário 1'),
})

const bodyValidationPipe = new ZodValidationPipe(syncGoogleSheetBodySchema)

type SyncGoogleSheetBodySchema = z.infer<typeof syncGoogleSheetBodySchema>

@Controller('/integrations/google-sheet')
@ApiTags('Integrations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyncGoogleSheetController {
  constructor(
    private readonly syncProblemsFromGoogleSheet: SyncProblemsFromGoogleSheetUseCase,
  ) {}

  @Post('sync')
  @Roles(UserRole.MANAGER, UserRole.DIRECTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Sincronizar problemas do Google Sheets',
    description:
      'Importa novos problemas da planilha do Google Forms. Evita duplicatas usando o índice da linha.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description:
            'ID da planilha (da URL: docs.google.com/spreadsheets/d/{ID}/edit)',
        },
        sheetName: {
          type: 'string',
          description: 'Nome da aba (padrão: Formulário 1)',
        },
      },
      required: ['spreadsheetId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sincronização concluída',
    schema: {
      type: 'object',
      properties: {
        imported: { type: 'number' },
        skipped: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão (requer MANAGER+)',
  })
  async handle(@Body(bodyValidationPipe) body: SyncGoogleSheetBodySchema) {
    const result = await this.syncProblemsFromGoogleSheet.execute({
      spreadsheetId: body.spreadsheetId,
      sheetName: body.sheetName,
    })

    return result.value
  }
}
