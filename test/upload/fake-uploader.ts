import { ImageUploader, UploadParams, UploadResponse } from '@/domain/maintenance-problems/application/upload/image-uploader'
import { randomUUID } from 'crypto'

export class FakeUploader implements ImageUploader {
  public uploads: UploadParams[] = []

  async upload(params: UploadParams): Promise<UploadResponse> {
    this.uploads.push(params)

    const fileId = randomUUID()

    return {
      url: `https://fake-imgbb.com/${fileId}/${params.fileName}`,
      deleteUrl: `https://fake-imgbb.com/delete/${fileId}`,
    }
  }
}
