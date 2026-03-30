import { Body, Controller, Post } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { z } from 'zod'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { ImportProblemsFromCsvUseCase } from '@/domain/maintenance-problems/application/use-cases/import-problems-from-csv'
import {
  ImportProblemsCsvRequest,
  ImportProblemsCsvResponse,
} from '../dtos/interfaces.dto'

const importProblemsFromCsvBodySchema = z.object({
  rows: z
    .array(
      z.object({
        rowNumber: z.number().int().positive(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        locationName: z.string(),
        locationCode: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .min(1, 'Envie pelo menos uma linha para importar.')
    .max(500, 'Envie no máximo 500 linhas por importação.'),
})

const bodyValidationPipe = new ZodValidationPipe(
  importProblemsFromCsvBodySchema,
)

type ImportProblemsFromCsvBodySchema = z.infer<
  typeof importProblemsFromCsvBodySchema
>

@Controller('/problems')
@ApiTags('Problems')
@ApiBearerAuth('JWT-auth')
export class ImportProblemsFromCsvController {
  constructor(
    private readonly importProblemsFromCsv: ImportProblemsFromCsvUseCase,
  ) {}

  @Post('import')
  @ApiOperation({
    summary: 'Importar problemas via CSV',
    description:
      'Recebe linhas já extraídas de um CSV, valida os dados e importa apenas os problemas válidos e não duplicados.',
  })
  @ApiBody({ type: ImportProblemsCsvRequest })
  @ApiResponse({
    status: 200,
    description: 'Importação processada com sucesso.',
    type: ImportProblemsCsvResponse,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  async handle(
    @Body(bodyValidationPipe) body: ImportProblemsFromCsvBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.importProblemsFromCsv.execute({
      reporterId: user.sub,
      rows: body.rows,
    })

    return result.value
  }
}
