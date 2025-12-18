import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

@Injectable()
export class UuidValidationPipe implements PipeTransform {
  transform(value: any) {
    const result = uuidSchema.safeParse(value)

    if (!result.success) {
      throw new BadRequestException('Invalid UUID format')
    }

    return result.data
  }
}
