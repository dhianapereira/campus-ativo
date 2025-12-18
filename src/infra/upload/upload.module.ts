import { Module } from '@nestjs/common'
import { ImageUploader } from '@/domain/maintenance-problems/application/upload/image-uploader'
import { ImgBBUploader } from './imgbb-uploader'

@Module({
  providers: [
    {
      provide: ImageUploader,
      useClass: ImgBBUploader,
    },
  ],
  exports: [ImageUploader],
})
export class UploadModule {}
