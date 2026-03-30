import {
  ImageUploader,
  UploadParams,
  UploadResponse,
} from '@/domain/maintenance-problems/application/upload/image-uploader'
import { randomUUID } from 'crypto'

export class FakeUploader implements ImageUploader {
  public uploads: UploadParams[] = []
  public deletedStorageKeys: string[] = []

  async upload(params: UploadParams): Promise<UploadResponse> {
    this.uploads.push(params)

    const fileId = randomUUID()
    const storageKey = `fake-uploads/${fileId}/${params.fileName}`

    return {
      storageKey,
      url: `https://fake-s3.local/${storageKey}`,
    }
  }

  async delete(storageKey: string): Promise<void> {
    this.deletedStorageKeys.push(storageKey)
  }
}
