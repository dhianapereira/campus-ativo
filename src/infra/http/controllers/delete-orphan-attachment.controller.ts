import {
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { DeleteOrphanAttachmentUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-orphan-attachment'
import { RateLimit } from '../rate-limit/rate-limit.decorator'
import { RateLimitGuard } from '../rate-limit/rate-limit.guard'

@Controller('/attachments/:id/orphan')
@ApiTags('Attachments')
@ApiBearerAuth('JWT-auth')
export class DeleteOrphanAttachmentController {
  constructor(
    private readonly deleteOrphanAttachment: DeleteOrphanAttachmentUseCase,
  ) {}

  @Delete()
  @HttpCode(204)
  @UseGuards(RateLimitGuard)
  @RateLimit({
    key: 'attachment-orphan-delete',
    limit: 20,
    windowMs: 5 * 60 * 1000,
  })
  @ApiOperation({
    summary: 'Excluir attachment órfão',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do attachment órfão',
  })
  @ApiResponse({ status: 204, description: 'Attachment órfão removido.' })
  @ApiResponse({ status: 404, description: 'Attachment órfão não encontrado.' })
  async handle(
    @Param('id') attachmentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.deleteOrphanAttachment.execute({
      attachmentId,
      ownerId: user.sub,
    })

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException('Attachment órfão não encontrado.')
      }

      throw result.value
    }
  }
}
