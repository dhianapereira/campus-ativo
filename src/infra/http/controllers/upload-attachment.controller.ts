import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger'
import { UploadAttachmentUseCase } from '@/domain/maintenance-problems/application/use-cases/upload-attachment'
import { AttachmentUrlResolver } from '@/domain/maintenance-problems/application/upload/attachment-url-resolver'

interface UploadedFile {
  originalname: string
  mimetype: string
  buffer: Buffer
}

@Controller('/attachments')
@ApiTags('Attachments')
@ApiBearerAuth('JWT-auth')
export class UploadAttachmentController {
  constructor(
    private uploadAttachment: UploadAttachmentUseCase,
    private attachmentUrlResolver: AttachmentUrlResolver,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de imagem',
    description:
      'Faz upload de uma imagem para o S3 privado e retorna o ID do attachment criado',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG, GIF, WEBP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Imagem enviada com sucesso',
    schema: {
      type: 'object',
      properties: {
        attachmentId: {
          type: 'string',
          description: 'ID do attachment criado',
        },
        url: {
          type: 'string',
          description: 'URL assinada da imagem no S3',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  async handle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 32 * 1024 * 1024,
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|jpg|png|gif|webp)$/,
          }),
        ],
      }),
    )
    file: UploadedFile,
  ) {
    const result = await this.uploadAttachment.execute({
      fileName: file.originalname,
      fileType: file.mimetype,
      body: file.buffer,
    })

    if (result.isLeft()) {
      const error = result.value
      throw new BadRequestException(error.message)
    }

    const { attachment } = result.value
    const url = await this.attachmentUrlResolver.resolve(attachment.link)

    return {
      attachmentId: attachment.id.toValue(),
      url,
    }
  }
}
