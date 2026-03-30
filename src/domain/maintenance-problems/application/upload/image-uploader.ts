export interface UploadParams {
  fileName: string
  fileType: string
  body: Buffer
}

export interface UploadResponse {
  storageKey: string
  url: string
  deleteUrl?: string
}

export abstract class ImageUploader {
  abstract upload(params: UploadParams): Promise<UploadResponse>
  abstract delete(storageKey: string): Promise<void>
}
