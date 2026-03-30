import { AttachmentUrlResolver } from '@/domain/maintenance-problems/application/upload/attachment-url-resolver'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Env } from '../env/env'

@Injectable()
export class S3AttachmentUrlResolver implements AttachmentUrlResolver {
  private readonly bucketName: string
  private readonly signedUrlTtl: number
  private readonly client: S3Client

  constructor(private config: ConfigService<Env, true>) {
    this.bucketName = this.config.get('AWS_S3_BUCKET')
    this.signedUrlTtl = this.config.get('AWS_S3_SIGNED_URL_TTL')
    this.client = new S3Client({
      region: this.config.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
      },
    })
  }

  async resolve(storedValue: string): Promise<string> {
    if (/^https?:\/\//i.test(storedValue)) {
      return storedValue
    }

    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: storedValue,
        }),
        {
          expiresIn: this.signedUrlTtl,
        },
      )
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível gerar a URL do anexo no momento.',
      )
    }
  }
}
