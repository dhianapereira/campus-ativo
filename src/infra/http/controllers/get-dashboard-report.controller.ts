import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

@Controller('/dashboard/report')
@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GetDashboardReportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
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
        _count: { status: true },
      }),
      this.prisma.problem.groupBy({
        by: ['categoryId'],
        where: baseWhere,
        _count: { categoryId: true },
      }),
      this.prisma.problem.groupBy({
        by: ['locationId'],
        where: baseWhere,
        _count: { locationId: true },
      }),
      this.prisma.problem.groupBy({
        by: ['maintenanceType'],
        where: baseWhere,
        _count: { maintenanceType: true },
      }),
      this.prisma.problem.findMany({
        where: baseWhere,
        select: {
          title: true,
          description: true,
          createdAt: true,
          status: true,
          maintenanceType: true,
          location: { select: { name: true } },
          category: { select: { name: true } },
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
            select: { id: true, name: true },
          })
        : [],
      locationIds.length > 0
        ? this.prisma.location.findMany({
            where: { id: { in: locationIds } },
            select: { id: true, name: true },
          })
        : [],
    ])

    const categoryMap = new Map(
      categories.map((c) => [c.id, c.name] as [string, string]),
    )
    const locationMap = new Map(
      locations.map((l) => [l.id, l.name] as [string, string]),
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

    return {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      totalProblems: total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        label: statusLabels[s.status] ?? s.status,
        count: s._count.status,
      })),
      byCategory: byCategory.map((c) => ({
        categoryId: c.categoryId,
        name: c.categoryId ? categoryMap.get(c.categoryId) ?? 'Não informado' : 'Não informado',
        count: c._count.categoryId,
      })),
      byLocation: byLocation.map((l) => ({
        locationId: l.locationId,
        name:
          l.locationId != null
            ? locationMap.get(l.locationId) ?? 'Não informado'
            : 'Não informado',
        count: l._count.locationId,
      })),
      byMaintenanceType: byMaintenanceType.map((m) => ({
        type: m.maintenanceType,
        label:
          m.maintenanceType != null
            ? maintenanceTypeLabels[m.maintenanceType] ?? m.maintenanceType
            : 'Não informado',
        count: m._count.maintenanceType,
      })),
      problems: problems.map((p) => ({
        title: p.title,
        description: p.description,
        location: p.location?.name ?? '-',
        createdAt: p.createdAt.toISOString(),
        status: statusLabels[p.status] ?? p.status,
        category: p.category?.name ?? '-',
        maintenanceType:
          p.maintenanceType != null
            ? maintenanceTypeLabels[p.maintenanceType]
            : '-',
      })),
    }
  }
}
