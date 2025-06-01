import { Controller, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@Controller('/problems')
@UseGuards(JwtAuthGuard)
export class CreateProblemController {
  constructor() {}

  @Post()
  async handle() {
    return 'ok'
  }
}
