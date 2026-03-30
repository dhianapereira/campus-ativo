import {
  ImageUploader,
  UploadParams,
  UploadResponse,
} from '@/domain/maintenance-problems/application/upload/image-uploader'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Env } from '../env/env'
import { randomUUID } from 'crypto'

@Injectable()
export class S3Uploader implements ImageUploader {
  private readonly bucketName: string
  private readonly keyPrefix?: string
  private readonly client: S3Client

  constructor(private config: ConfigService<Env, true>) {
    this.bucketName = this.config.get('AWS_S3_BUCKET')
    this.keyPrefix = this.config.get('AWS_S3_PREFIX')
    this.client = new S3Client({
      region: this.config.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
      },
    })
  }

  async upload({
    fileName,
    fileType,
    body,
  }: UploadParams): Promise<UploadResponse> {
    const objectKey = this.buildObjectKey(fileName)

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: body,
          ContentType: fileType,
        }),
      )
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível enviar o arquivo no momento.',
      )
    }

    return {
      storageKey: objectKey,
      url: objectKey,
    }
  }

  async delete(storageKey: string): Promise<void> {
    if (/^https?:\/\//i.test(storageKey)) {
      return
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
        }),
      )
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível remover o arquivo no momento.',
      )
    }
  }

  private buildObjectKey(fileName: string) {
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const sanitizedFileName = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()

    const safeFileName = sanitizedFileName || 'arquivo'
    const parts = [this.keyPrefix, 'attachments', String(year), month].filter(
      Boolean,
    )

    return `${parts.join('/')}/${randomUUID()}-${safeFileName}`
  }
}
