import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchRecentProblemsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-problems'
import { ProblemPresenter } from '../presenters/problem-presenter'

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
  constructor(private fetchProblems: FetchRecentProblemsUseCase) {}

  @Get()
  async handle(@Query('page', queryValidationPipe) page: PageQueryParamSchema) {
    const result = await this.fetchProblems.execute({ page })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const problems = result.value.problems

    return { problems: problems.map(ProblemPresenter.toHTTP) }
  }
}
