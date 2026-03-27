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
    pageSize = 20,
    query,
    statuses,
    includeDeleted = false,
    reporterId,
  }: FetchProblemsParams) {
    // Purged problems are never listed.
    let problems = this.items.filter((problem) => !problem.isPurged)

    if (reporterId) {
      problems = problems.filter(
        (problem) => problem.reporterId.toValue() === reporterId,
      )
    }

    // Filter out trashed problems unless includeDeleted is true
    if (!includeDeleted) {
      problems = problems.filter((problem) => !problem.isDeleted)
    }

    if (statuses && statuses.length > 0) {
      problems = problems.filter((problem) => statuses.includes(problem.status))
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
    problems = problems.sort(compareProblemsForListing)

    return {
      items: problems.slice((page - 1) * pageSize, page * pageSize),
      total: problems.length,
    }
  }

  async findManyWithDetails({
    page,
    pageSize = 20,
    query,
    statuses,
    includeDeleted = false,
    reporterId,
  }: FetchProblemsParams): Promise<{
    items: ProblemWithDetails[]
    total: number
  }> {
    // Purged problems are never listed.
    let problems = this.items.filter((problem) => !problem.isPurged)

    if (reporterId) {
      problems = problems.filter(
        (problem) => problem.reporterId.toValue() === reporterId,
      )
    }

    // Filter out trashed problems unless includeDeleted is true
    if (!includeDeleted) {
      problems = problems.filter((problem) => !problem.isDeleted)
    }

    if (statuses && statuses.length > 0) {
      problems = problems.filter((problem) => statuses.includes(problem.status))
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
    problems = problems.sort(compareProblemsForListing)

    const paginatedProblems = problems.slice(
      (page - 1) * pageSize,
      page * pageSize,
    )

    // Map to ProblemWithDetails
    const problemsWithDetails = paginatedProblems.map(
      (problem) =>
        new ProblemWithDetails({
          problemId: problem.id,
          reporterId: problem.reporterId,
          reporterEmail: `${problem.reporterId.toValue()}@test.local`,
          title: problem.title,
          slug: problem.slug,
          excerpt: problem.excerpt,
          locationName: 'Localização de teste',
          status: problem.status,
          createdAt: problem.createdAt,
          updatedAt: problem.updatedAt,
          deletedAt: problem.deletedAt,
        }),
    )

    return {
      items: problemsWithDetails,
      total: problems.length,
    }
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
      (problem) => problem.reporterId.toValue() === fromUserId,
    )

    userProblems.forEach((problem) => {
      problem.changeReporter(new UniqueEntityID(toUserId))
    })
  }
}

const problemStatusOrder = Object.values(ProblemStatus)

function compareProblemsForListing(
  a: Pick<Problem, 'createdAt' | 'status' | 'id'>,
  b: Pick<Problem, 'createdAt' | 'status' | 'id'>,
) {
  const statusDifference =
    problemStatusOrder.indexOf(a.status) - problemStatusOrder.indexOf(b.status)

  if (statusDifference !== 0) {
    return statusDifference
  }

  const createdAtDifference = b.createdAt.getTime() - a.createdAt.getTime()

  if (createdAtDifference !== 0) {
    return createdAtDifference
  }

  return b.id.toValue().localeCompare(a.id.toValue())
}
