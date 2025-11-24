import { ProblemStatus } from '../problems/problem'

interface StatusCount {
  status: ProblemStatus
  count: number
}

export interface DashboardMetricsProps {
  totalProblems: number
  problemsByStatus: StatusCount[]
  recentProblems: number // Problems created in last 7 days
  averageResolutionTime?: number // In days (null if no finished problems)
}

export class DashboardMetrics {
  public totalProblems: number
  public problemsByStatus: StatusCount[]
  public recentProblems: number
  public averageResolutionTime?: number

  constructor(props: DashboardMetricsProps) {
    this.totalProblems = props.totalProblems
    this.problemsByStatus = props.problemsByStatus
    this.recentProblems = props.recentProblems
    this.averageResolutionTime = props.averageResolutionTime
  }

  getCountByStatus(status: ProblemStatus): number {
    const statusData = this.problemsByStatus.find((s) => s.status === status)
    return statusData?.count ?? 0
  }

  get toAnalysisCount(): number {
    return this.getCountByStatus(ProblemStatus.TO_ANALYSIS)
  }

  get inAnalysisCount(): number {
    return this.getCountByStatus(ProblemStatus.IN_ANALYSIS)
  }

  get acceptedCount(): number {
    return this.getCountByStatus(ProblemStatus.ACCEPTED)
  }

  get rejectedCount(): number {
    return this.getCountByStatus(ProblemStatus.REJECTED)
  }

  get inProgressCount(): number {
    return this.getCountByStatus(ProblemStatus.IN_PROGRESS)
  }

  get finishedCount(): number {
    return this.getCountByStatus(ProblemStatus.FINISHED)
  }
}
