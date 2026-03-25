import { ProblemAttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/problem-attachments-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ProblemsRepository,
  FetchProblemsParams,
} from '@/domain/maintenance-problems/application/repositories/problems-repository'
import {
  Problem,
  ProblemStatus,
} from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { DashboardMetrics } from '@/domain/maintenance-problems/enterprise/entities/value-objects/dashboard-metrics'

export class InMemoryProblemsRepository implements ProblemsRepository {
  public items: Problem[] = []

  constructor(
    private problemAttachmentsRepository: ProblemAttachmentsRepository,
  ) {}

  async findById(id: string) {
    const problem = this.items.find((item) => item.id.toValue() === id)

    if (!problem) {
      return null
    }

    return problem
  }

  async findBySlug(slug: string) {
    const problem = this.items.find(
      (item) => item.slug.value === slug && !item.isDeleted && !item.isPurged,
    )

    if (!problem) {
      return null
    }

    return problem
  }

  async findMany({
    page,
    query,
    includeDeleted = false,
    reporterId,
  }: FetchProblemsParams) {
    // Purged problems are never listed.
    let problems = this.items.filter((problem) => !problem.isPurged)

    if (reporterId) {
      problems = problems.filter(
        (problem) => problem.reporterId?.toValue() === reporterId,
      )
    }

    // Filter out trashed problems unless includeDeleted is true
    if (!includeDeleted) {
      problems = problems.filter((problem) => !problem.isDeleted)
    }

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
    includeDeleted = false,
    reporterId,
  }: FetchProblemsParams): Promise<ProblemWithDetails[]> {
    // Purged problems are never listed.
    let problems = this.items.filter((problem) => !problem.isPurged)

    if (reporterId) {
      problems = problems.filter(
        (problem) => problem.reporterId?.toValue() === reporterId,
      )
    }

    // Filter out trashed problems unless includeDeleted is true
    if (!includeDeleted) {
      problems = problems.filter((problem) => !problem.isDeleted)
    }

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
    const problemsWithDetails = problems.map(
      (problem) =>
        new ProblemWithDetails({
          problemId: problem.id,
          reporterId: problem.reporterId,
          title: problem.title,
          slug: problem.slug,
          excerpt: problem.excerpt,
          locationName: problem.locationId
            ? 'Localização de teste'
            : 'Localização excluída',
          status: problem.status,
          createdAt: problem.createdAt,
          updatedAt: problem.updatedAt,
          deletedAt: problem.deletedAt,
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

    // Filter out trashed/purged problems
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

  async migrateUserProblems(
    fromUserId: string,
    toUserId: string,
  ): Promise<void> {
    // Find all problems belonging to the user
    const userProblems = this.items.filter(
      (problem) => problem.reporterId?.toValue() === fromUserId,
    )

    // Update each problem to belong to the new user
    userProblems.forEach((problem) => {
      // Create a new UniqueEntityID for the new reporter
      const newReporterId = new UniqueEntityID(toUserId)

      // Update the problem directly by forcing the new reporterId
      // In a real implementation, this would be handled by the entity
      Object.defineProperty(problem, 'reporterId', {
        value: newReporterId,
        writable: false,
        configurable: true,
      })
    })
  }
}
