import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

type ReportCategorySummary = {
  name: string
  description: string | null
}

type ReportLocationSummary = {
  name: string
  code: string | null
  description: string | null
}

@Controller('/dashboard/report')
@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class GetDashboardReportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Dados para relatório em PDF',
    description:
      'Retorna dados agregados e lista de problemas em um período para geração de relatório.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Data inicial do período (ISO 8601)',
    type: String,
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Data final do período (ISO 8601)',
    type: String,
    example: '2025-01-31T23:59:59.999Z',
  })
  @ApiResponse({ status: 200, description: 'Dados do relatório' })
  @ApiResponse({ status: 400, description: 'Datas inválidas' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  async handle(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    if (!startDateStr || !endDateStr) {
      throw new BadRequestException('startDate e endDate são obrigatórios')
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Datas inválidas')
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'Data inicial não pode ser maior que a data final',
      )
    }

    const baseWhere = {
      deletedAt: null,
      purgedAt: null,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    const [
      total,
      byStatus,
      byCategory,
      byLocation,
      byMaintenanceType,
      problems,
    ] = await Promise.all([
      this.prisma.problem.count({ where: baseWhere }),
      this.prisma.problem.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
      this.prisma.problem.groupBy({
        by: ['categoryId'],
        where: baseWhere,
        _count: { _all: true },
      }),
      this.prisma.problem.groupBy({
        by: ['locationId'],
        where: baseWhere,
        _count: { _all: true },
      }),
      this.prisma.problem.groupBy({
        by: ['maintenanceType'],
        where: baseWhere,
        _count: { _all: true },
      }),
      this.prisma.problem.findMany({
        where: baseWhere,
        select: {
          title: true,
          description: true,
          createdAt: true,
          status: true,
          maintenanceType: true,
          location: {
            select: {
              name: true,
              code: true,
              description: true,
            },
          },
          category: {
            select: {
              name: true,
              description: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const categoryIds = [
      ...new Set(
        byCategory
          .map((c) => c.categoryId)
          .filter((id): id is string => id != null),
      ),
    ]
    const locationIds = [
      ...new Set(
        byLocation
          .map((l) => l.locationId)
          .filter((id): id is string => id != null),
      ),
    ]

    const [categories, locations] = await Promise.all([
      categoryIds.length > 0
        ? this.prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, description: true },
          })
        : [],
      locationIds.length > 0
        ? this.prisma.location.findMany({
            where: { id: { in: locationIds } },
            select: { id: true, name: true, code: true, description: true },
          })
        : [],
    ])

    const categoryMap = new Map<string, ReportCategorySummary>(
      categories.map((c): [string, ReportCategorySummary] => [
        c.id,
        {
          name: c.name,
          description: c.description,
        },
      ]),
    )
    const locationMap = new Map<string, ReportLocationSummary>(
      locations.map((l): [string, ReportLocationSummary] => [
        l.id,
        {
          name: l.name,
          code: l.code,
          description: l.description,
        },
      ]),
    )

    const statusLabels: Record<string, string> = {
      TO_ANALYSIS: 'Para análise',
      IN_ANALYSIS: 'Em análise',
      ACCEPTED: 'Aceito',
      REJECTED: 'Recusado',
      IN_PROGRESS: 'Em andamento',
      FINISHED: 'Concluído',
    }

    const maintenanceTypeLabels: Record<string, string> = {
      PREVENTIVE: 'Preventiva',
      CORRECTIVE: 'Corretiva',
    }

    const statusOrder: Record<string, number> = {
      TO_ANALYSIS: 1,
      IN_ANALYSIS: 2,
      ACCEPTED: 3,
      IN_PROGRESS: 4,
      FINISHED: 5,
      REJECTED: 6,
    }

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalProblems: total,
      byStatus: byStatus
        .map((s) => ({
          status: s.status,
          label: statusLabels[s.status] ?? s.status,
          count: s._count._all,
        }))
        .sort(
          (a, b) =>
            (statusOrder[a.status] ?? Number.MAX_SAFE_INTEGER) -
            (statusOrder[b.status] ?? Number.MAX_SAFE_INTEGER),
        ),
      byCategory: byCategory
        .map((c) => {
          const category =
            c.categoryId != null
              ? categoryMap.get(c.categoryId)
              : null

          return {
            categoryId: c.categoryId,
            name: category?.name ?? 'Não informado',
            description: category?.description ?? null,
            count: c._count._all,
          }
        })
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      byLocation: byLocation
        .map((l) => {
          const location =
            l.locationId != null
              ? locationMap.get(l.locationId)
              : null

          return {
            locationId: l.locationId,
            name: location?.name ?? 'Não informado',
            code: location?.code ?? null,
            description: location?.description ?? null,
            count: l._count._all,
          }
        })
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      byMaintenanceType: byMaintenanceType
        .map((m) => ({
          type: m.maintenanceType,
          label:
            m.maintenanceType != null
              ? (maintenanceTypeLabels[m.maintenanceType] ?? m.maintenanceType)
              : 'Não informado',
          count: m._count._all,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      problems: problems.map((p) => ({
        title: p.title,
        description: p.description,
        location: p.location?.name ?? '-',
        locationCode: p.location?.code ?? null,
        locationDescription: p.location?.description ?? null,
        createdAt: p.createdAt.toISOString(),
        status: statusLabels[p.status] ?? p.status,
        category: p.category?.name ?? '-',
        categoryDescription: p.category?.description ?? null,
        maintenanceType:
          p.maintenanceType != null
            ? maintenanceTypeLabels[p.maintenanceType]
            : '-',
      })),
    }
  }
}
