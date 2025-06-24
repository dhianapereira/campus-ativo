import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { RegisterReporterUseCase } from '@/domain/accounts/application/use-cases/register-reporter'

const createAccountBodySchema = z.object({
  name: z.string(),
  position: z.string(),
  email: z.string().email(),
  password: z.string(),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
export class CreateAccountController {
  constructor(private readonly registerReporter: RegisterReporterUseCase) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    const { name, position, email, password } = body

    const result = await this.registerReporter.execute({
      name,
      position,
      email,
      password,
    })

    if (result.isLeft()) {
      throw new Error()
    }
  }
}
