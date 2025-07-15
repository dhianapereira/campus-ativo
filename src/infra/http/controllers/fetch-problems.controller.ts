import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchProblemsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-problems'
import { ProblemPresenter } from '../presenters/problem-presenter'
import { Roles } from '@/infra/auth/roles.decorator'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/problems')
export class FetchProblemsController {
  constructor(private fetchProblems: FetchProblemsUseCase) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.REPORTER, UserRole.MANAGER, UserRole.DIRECTOR, UserRole.ADMIN)
  async handle(@Query('page', queryValidationPipe) page: PageQueryParamSchema) {
    const result = await this.fetchProblems.execute({ page })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const problems = result.value.problems

    return { problems: problems.map(ProblemPresenter.toHTTP) }
  }
}
