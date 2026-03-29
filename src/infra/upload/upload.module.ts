import { Module } from '@nestjs/common'
import { ImageUploader } from '@/domain/maintenance-problems/application/upload/image-uploader'
import { S3Uploader } from './s3-uploader'
import { AttachmentUrlResolver } from '@/domain/maintenance-problems/application/upload/attachment-url-resolver'
import { S3AttachmentUrlResolver } from './s3-attachment-url-resolver'

@Module({
  providers: [
    {
      provide: ImageUploader,
      useClass: S3Uploader,
    },
    {
      provide: AttachmentUrlResolver,
      useClass: S3AttachmentUrlResolver,
    },
  ],
  exports: [ImageUploader, AttachmentUrlResolver],
})
export class UploadModule {}
