import { BadRequestException, Controller, Get, Param } from '@nestjs/common'
import { GetProblemBySlugUseCase } from '@/domain/maintenance-problems/application/use-cases/get-problem-by-slug'
import { ProblemPresenter } from '../presenters/problem-presenter'

@Controller('/problems/:slug')
export class GetProblemBySlugController {
  constructor(private getProblemBySlug: GetProblemBySlugUseCase) {}

  @Get()
  async handle(@Param('slug') slug: string) {
    const result = await this.getProblemBySlug.execute({
      slug,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return { problem: ProblemPresenter.toHTTP(result.value.problem) }
  }
}
