import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common'
import { GetProblemBySlugUseCase } from '@/domain/maintenance-problems/application/use-cases/get-problem-by-slug'
import { ProblemPresenter } from '../presenters/problem-presenter'
import { Roles } from '@/infra/auth/roles.decorator'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

@Controller('/problems/:slug')
export class GetProblemBySlugController {
  constructor(private getProblemBySlug: GetProblemBySlugUseCase) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.REPORTER, UserRole.MANAGER, UserRole.DIRECTOR, UserRole.ADMIN)
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
