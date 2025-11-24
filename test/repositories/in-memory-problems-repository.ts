import { ProblemAttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/problem-attachments-repository'
import {
  ProblemsRepository,
  FetchProblemsParams,
} from '@/domain/maintenance-problems/application/repositories/problems-repository'
import { Problem, ProblemStatus } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { DashboardMetrics } from '@/domain/maintenance-problems/enterprise/entities/value-objects/dashboard-metrics'
import { LocationsRepository } from '@/domain/maintenance-problems/application/repositories/locations-repository'

export class InMemoryProblemsRepository implements ProblemsRepository {
  public items: Problem[] = []

  constructor(
    private problemAttachmentsRepository: ProblemAttachmentsRepository,
    private locationsRepository?: LocationsRepository,
  ) {}

  async findById(id: string) {
    const problem = this.items.find((item) => item.id.toValue() === id)

    if (!problem) {
      return null
    }

    return problem
  }

  async findBySlug(slug: string) {
    const problem = this.items.find((item) => item.slug.value === slug)

    if (!problem) {
      return null
    }

    return problem
  }

  async findMany({ page, query }: FetchProblemsParams) {
    // Filter out deleted problems
    let problems = this.items.filter((problem) => !problem.isDeleted)

    // Filter by query (case-insensitive search in title and description)
    if (query) {
      const lowerQuery = query.toLowerCase()
      problems = problems.filter((problem) => {
        const titleMatch = problem.title.toLowerCase().includes(lowerQuery)
        const descriptionMatch = problem.description
          .toLowerCase()
          .includes(lowerQuery)
        return titleMatch || descriptionMatch
      })
    }

    // Sort and paginate
    problems = problems
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20)

    return problems
  }

  async findManyWithDetails({
    page,
    query,
  }: FetchProblemsParams): Promise<ProblemWithDetails[]> {
    // Filter out deleted problems
    let problems = this.items.filter((problem) => !problem.isDeleted)

    // Filter by query (case-insensitive search in title and description)
    if (query) {
      const lowerQuery = query.toLowerCase()
      problems = problems.filter((problem) => {
        const titleMatch = problem.title.toLowerCase().includes(lowerQuery)
        const descriptionMatch = problem.description
          .toLowerCase()
          .includes(lowerQuery)
        return titleMatch || descriptionMatch
      })
    }

    // Sort and paginate
    problems = problems
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20)

    // Map to ProblemWithDetails
    const problemsWithDetails = await Promise.all(
      problems.map(async (problem) => {
        const location = await this.locationsRepository?.findById(
          problem.locationId.toValue(),
        )

        return new ProblemWithDetails({
          problemId: problem.id,
          title: problem.title,
          slug: problem.slug,
          excerpt: problem.excerpt,
          locationId: problem.locationId,
          locationName: location?.name ?? 'Local não informado',
          createdAt: problem.createdAt,
          updatedAt: problem.updatedAt,
        })
      }),
    )

    return problemsWithDetails
  }

  async create(problem: Problem) {
    this.items.push(problem)
  }

  async delete(problem: Problem) {
    const itemIndex = this.items.findIndex((item) => item.id === problem.id)

    this.items.splice(itemIndex, 1)

    this.problemAttachmentsRepository.deleteManyByProblemId(
      problem.id.toValue(),
    )
  }

  async save(problem: Problem) {
    const itemIndex = this.items.findIndex((item) => item.id === problem.id)

    this.items[itemIndex] = problem
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Filter out deleted problems
    const activeProblems = this.items.filter((problem) => !problem.isDeleted)

    // Count total problems
    const totalProblems = activeProblems.length

    // Count problems by status
    const statusCounts = new Map<ProblemStatus, number>()
    activeProblems.forEach((problem) => {
      const current = statusCounts.get(problem.status) || 0
      statusCounts.set(problem.status, current + 1)
    })

    const problemsByStatus = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({
        status,
        count,
      }),
    )

    // Count recent problems (last 7 days)
    const recentProblems = activeProblems.filter(
      (problem) => problem.createdAt >= sevenDaysAgo,
    ).length

    // Calculate average resolution time for finished problems
    const finishedProblems = activeProblems.filter(
      (problem) =>
        problem.status === ProblemStatus.FINISHED && problem.updatedAt,
    )

    let averageResolutionTime: number | undefined

    if (finishedProblems.length > 0) {
      const totalDays = finishedProblems.reduce((sum, problem) => {
        const createdAt = problem.createdAt.getTime()
        const finishedAt = problem.updatedAt!.getTime()
        const diffInDays = (finishedAt - createdAt) / (1000 * 60 * 60 * 24)
        return sum + diffInDays
      }, 0)

      averageResolutionTime = Math.round(totalDays / finishedProblems.length)
    }

    return new DashboardMetrics({
      totalProblems,
      problemsByStatus,
      recentProblems,
      averageResolutionTime,
    })
  }
}
