import {
  ImageUploader,
  UploadParams,
  UploadResponse,
} from '@/domain/maintenance-problems/application/upload/image-uploader'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from '../env/env'

interface ImgBBResponse {
  data: {
    id: string
    title: string
    url_viewer: string
    url: string
    display_url: string
    width: string
    height: string
    size: string
    time: string
    expiration: string
    image: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    thumb: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    medium: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    delete_url: string
  }
  success: boolean
  status: number
}

@Injectable()
export class ImgBBUploader implements ImageUploader {
  private apiKey: string

  constructor(private config: ConfigService<Env, true>) {
    this.apiKey = this.config.get('IMGBB_API_KEY')
  }

  async upload({ fileName, body }: UploadParams): Promise<UploadResponse> {
    const formData = new FormData()

    // Convert Buffer to base64
    const base64Image = body.toString('base64')

    formData.append('key', this.apiKey)
    formData.append('image', base64Image)
    formData.append('name', fileName)

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ImgBB upload failed: ${response.status} - ${errorText}`)
    }

    const data = (await response.json()) as ImgBBResponse

    if (!data.success) {
      throw new Error('ImgBB upload failed: success is false')
    }

    return {
      url: data.data.display_url,
      deleteUrl: data.data.delete_url,
    }
  }
}
