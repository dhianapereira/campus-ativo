import { BadRequestException, Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { GetDashboardMetricsUseCase } from '@/domain/maintenance-problems/application/use-cases/get-dashboard-metrics'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

@Controller('/dashboard/metrics')
@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GetDashboardMetricsController {
  constructor(
    private readonly getDashboardMetrics: GetDashboardMetricsUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Métricas do dashboard',
    description:
      'Retorna métricas para o dashboard: contagens por status, top 3 setores, top 3 categorias e manutenção preventiva vs corretiva por mês.',
  })
  @ApiResponse({ status: 200, description: 'Métricas retornadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  async handle() {
    const result = await this.getDashboardMetrics.execute()

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const metrics = result.value.metrics

    const baseWhere = { deletedAt: null, purgedAt: null }

    const [topLocationsRaw, topCategoriesRaw, problemsForChart] =
      await Promise.all([
        this.prisma.problem.groupBy({
          by: ['locationId'],
          where: {
            ...baseWhere,
            locationId: { not: null },
          },
          _count: { locationId: true },
        }),
        this.prisma.problem.groupBy({
          by: ['categoryId'],
          where: baseWhere,
          _count: { categoryId: true },
        }),
        this.prisma.problem.findMany({
          where: baseWhere,
          select: {
            createdAt: true,
            maintenanceType: true,
          },
        }),
      ])

    const topLocationsSorted = [...topLocationsRaw].sort(
      (a, b) => b._count.locationId - a._count.locationId,
    )
    const topCategoriesSorted = [...topCategoriesRaw].sort(
      (a, b) => b._count.categoryId - a._count.categoryId,
    )

    const locationIds = topLocationsSorted
      .slice(0, 3)
      .map((r) => r.locationId)
      .filter((id): id is string => id != null)
    const categoryIds = topCategoriesSorted
      .slice(0, 3)
      .map((r) => r.categoryId)
      .filter((id): id is string => id != null)

    const [locations, categories] = await Promise.all([
      locationIds.length > 0
        ? this.prisma.location.findMany({
            where: { id: { in: locationIds } },
            select: { id: true, name: true },
          })
        : [],
      categoryIds.length > 0
        ? this.prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [],
    ])

    const locationMap = new Map(
      locations.map((l) => [l.id, l.name] as [string, string]),
    )
    const categoryMap = new Map(
      categories.map((c) => [c.id, c.name] as [string, string]),
    )

    const top3Locations = topLocationsSorted.slice(0, 3).map((r) => ({
      name: r.locationId ? locationMap.get(r.locationId) ?? 'Sem local' : 'Sem local',
      count: r._count.locationId,
    }))

    const top3Categories = topCategoriesSorted.slice(0, 3).map((r) => ({
      name: r.categoryId ? categoryMap.get(r.categoryId) ?? 'Sem categoria' : 'Sem categoria',
      count: r._count.categoryId,
    }))

    const now = new Date()
    const months: { month: string; label: string; preventive: number; corrective: number }[] = []
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${monthNames[d.getMonth()]}.`

      let preventive = 0
      let corrective = 0
      for (const p of problemsForChart) {
        const created = p.createdAt.getTime()
        if (created >= start.getTime() && created <= end.getTime()) {
          if (p.maintenanceType === 'PREVENTIVE') preventive++
          else if (p.maintenanceType === 'CORRECTIVE') corrective++
        }
      }
      months.push({ month: key, label, preventive, corrective })
    }

    return {
      toAnalysisCount: metrics.toAnalysisCount,
      inAnalysisCount: metrics.inAnalysisCount,
      inProgressCount: metrics.inProgressCount,
      totalProblems: metrics.totalProblems,
      recentProblems: metrics.recentProblems,
      top3Locations,
      top3Categories,
      maintenanceByMonth: months,
    }
  }
}
