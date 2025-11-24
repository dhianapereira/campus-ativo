import { Either, right } from '@/core/either'
import { DashboardMetrics } from '../../enterprise/entities/value-objects/dashboard-metrics'
import { ProblemsRepository } from '../repositories/problems-repository'
import { Injectable } from '@nestjs/common'

type GetDashboardMetricsUseCaseResponse = Either<
  null,
  {
    metrics: DashboardMetrics
  }
>

@Injectable()
export class GetDashboardMetricsUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute(): Promise<GetDashboardMetricsUseCaseResponse> {
    const metrics = await this.problemsRepository.getDashboardMetrics()

    return right({
      metrics,
    })
  }
}
