import { ApiProperty } from '@nestjs/swagger'

export enum UserRoleEnum {
  REPORTER = 'REPORTER',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
}

export class CreateAccountRequest {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  name!: string

  @ApiProperty({
    description: 'Cargo/posição do usuário na instituição',
    example: 'Técnico em Informática',
  })
  position!: string

  @ApiProperty({
    description:
      'Email institucional (domínios @ifal.edu.br ou @aluno.ifal.edu.br)',
    example: 'joao.silva@ifal.edu.br',
  })
  email!: string

  @ApiProperty({
    description: 'Senha do usuário',
    example: '123456789',
    minLength: 6,
  })
  password!: string
}

export class AuthenticateRequest {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@ifal.edu.br',
  })
  email!: string

  @ApiProperty({
    description: 'Senha do usuário',
    example: '123456789',
  })
  password!: string
}

export class AuthenticateResponse {
  @ApiProperty({
    description: 'Token JWT de acesso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string
}

export class CreateProblemRequest {
  @ApiProperty({
    description: 'Título do problema',
    example: 'Ar condicionado não está funcionando',
  })
  title!: string

  @ApiProperty({
    description: 'Descrição detalhada do problema',
    example: 'O ar condicionado da sala 201 não está ligando há 3 dias',
  })
  description!: string

  @ApiProperty({
    description: 'ID da categoria do problema',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  categoryId?: string

  @ApiProperty({
    description: 'ID da localização onde ocorreu o problema',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  locationId!: string

  @ApiProperty({
    description: 'IDs dos anexos (retornados pelo upload)',
    example: ['123e4567-e89b-12d3-a456-426614174002'],
    required: false,
    type: [String],
  })
  attachmentIds?: string[]
}

export class EditProblemRequest {
  @ApiProperty({
    description: 'Novo título do problema',
    example: 'Ar condicionado com defeito na sala 201',
  })
  title!: string

  @ApiProperty({
    description: 'Nova descrição do problema',
    example:
      'O ar condicionado da sala 201 está fazendo ruído estranho e não resfriando adequadamente',
  })
  description!: string

  @ApiProperty({
    description:
      'IDs dos anexos. Envie array vazio para remover todos os anexos.',
    example: ['123e4567-e89b-12d3-a456-426614174002'],
    required: false,
    type: [String],
  })
  attachmentIds?: string[]
}

export class CreateCategoryRequest {
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Climatização',
  })
  name!: string

  @ApiProperty({
    description: 'Descrição da categoria',
    example:
      'Problemas relacionados a ar condicionado, ventilação e climatização',
  })
  description!: string
}

export class EditCategoryRequest {
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Climatização',
    required: false,
  })
  name?: string

  @ApiProperty({
    description: 'Descrição da categoria',
    example:
      'Problemas relacionados a ar condicionado, ventilação e climatização',
    required: false,
  })
  description?: string

  @ApiProperty({
    description: 'Status ativo/inativo da categoria',
    example: true,
    required: false,
  })
  isActive?: boolean
}

export class CreateLocationRequest {
  @ApiProperty({
    description: 'Nome da localização',
    example: 'Bloco A - Sala 201',
  })
  name!: string

  @ApiProperty({
    description: 'Descrição da localização',
    example: 'Sala de aula localizada no primeiro andar do Bloco A',
  })
  description!: string

  @ApiProperty({
    description: 'Código identificador da localização',
    example: 'BLA-201',
  })
  code!: string
}

export class EditLocationRequest {
  @ApiProperty({
    description: 'Nome da localização',
    example: 'Bloco A - Sala 201',
    required: false,
  })
  name?: string

  @ApiProperty({
    description: 'Código identificador da localização',
    example: 'BLA-201',
    required: false,
  })
  code?: string

  @ApiProperty({
    description: 'Descrição da localização',
    example: 'Sala de aula localizada no primeiro andar do Bloco A',
    required: false,
  })
  description?: string

  @ApiProperty({
    description: 'Status ativo/inativo da localização',
    example: true,
    required: false,
  })
  isActive?: boolean
}

export class ChangeUserRoleRequest {
  @ApiProperty({
    description: 'Novo role do usuário',
    enum: UserRoleEnum,
    example: UserRoleEnum.MANAGER,
  })
  role!: UserRoleEnum
}

export class UserResponse {
  @ApiProperty({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  name!: string

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@ifal.edu.br',
  })
  email!: string

  @ApiProperty({
    description: 'Cargo/posição do usuário',
    example: 'Técnico em Informática',
  })
  position!: string

  @ApiProperty({
    description: 'Role do usuário',
    enum: UserRoleEnum,
    example: UserRoleEnum.REPORTER,
  })
  role!: UserRoleEnum
}

export class ProblemLocationInfo {
  @ApiProperty({
    description: 'ID da localização',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id!: string

  @ApiProperty({
    description: 'Nome da localização',
    example: 'Bloco A - Sala 201',
  })
  name!: string
}

export enum ProblemStatusEnum {
  TO_ANALYSIS = 'TO_ANALYSIS',
  IN_ANALYSIS = 'IN_ANALYSIS',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export enum MaintenanceTypeEnum {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
}

export class AttachmentInfo {
  @ApiProperty({
    description: 'ID do anexo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'Título do anexo',
    example: 'foto-ar-condicionado.jpg',
  })
  title!: string

  @ApiProperty({
    description: 'URL do anexo',
    example: 'https://i.ibb.co/xxxxx/foto-ar-condicionado.jpg',
  })
  url!: string
}

export class ProblemResponse {
  @ApiProperty({
    description: 'ID do problema',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'ID do autor do problema',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
    nullable: true,
  })
  reporterId?: string | null

  @ApiProperty({
    description: 'ID da categoria do problema',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
    nullable: true,
  })
  categoryId?: string | null

  @ApiProperty({
    description: 'ID da localização do problema',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
    nullable: true,
  })
  locationId?: string | null

  @ApiProperty({
    description: 'Título do problema',
    example: 'Ar condicionado não funcionando',
  })
  title!: string

  @ApiProperty({
    description: 'Descrição do problema',
    example: 'O ar condicionado da sala 201 não está ligando',
  })
  description!: string

  @ApiProperty({
    description: 'Slug do problema',
    example: 'ar-condicionado-nao-funcionando',
  })
  slug!: string

  @ApiProperty({
    description: 'Trecho da descrição do problema (primeiros 120 caracteres)',
    example: 'O ar condicionado da sala 201 não está ligando há 3 dias...',
  })
  excerpt!: string

  @ApiProperty({
    description: 'Status do problema',
    enum: ProblemStatusEnum,
    example: ProblemStatusEnum.TO_ANALYSIS,
  })
  status!: ProblemStatusEnum

  @ApiProperty({
    description: 'Tipo de manutenção',
    enum: MaintenanceTypeEnum,
    example: MaintenanceTypeEnum.CORRECTIVE,
    required: false,
    nullable: true,
  })
  maintenanceType?: MaintenanceTypeEnum | null

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt!: Date

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-01-15T10:30:00Z',
    required: false,
  })
  updatedAt?: Date

  @ApiProperty({
    description: 'Data de exclusão (null se não deletado)',
    example: '2025-01-15T10:30:00Z',
    required: false,
    nullable: true,
  })
  deletedAt?: Date | null

  @ApiProperty({
    description: 'Anexos do problema',
    type: [AttachmentInfo],
    required: false,
  })
  attachments?: AttachmentInfo[]
}

export class ProblemWithDetailsResponse {
  @ApiProperty({
    description: 'ID do problema',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'ID do autor do problema',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
    nullable: true,
  })
  reporterId?: string | null

  @ApiProperty({
    description: 'Título do problema',
    example: 'Ar condicionado não funcionando',
  })
  title!: string

  @ApiProperty({
    description: 'Slug do problema',
    example: 'ar-condicionado-nao-funcionando',
  })
  slug!: string

  @ApiProperty({
    description: 'Trecho da descrição do problema (primeiros 120 caracteres)',
    example: 'O ar condicionado da sala 201 não está ligando há 3 dias...',
  })
  excerpt!: string

  @ApiProperty({
    description: 'Informações da localização do problema',
    type: ProblemLocationInfo,
  })
  location!: ProblemLocationInfo

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt!: Date

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-01-15T10:30:00Z',
    required: false,
  })
  updatedAt?: Date

  @ApiProperty({
    description: 'Data de exclusão (null se não deletado)',
    example: '2025-01-15T10:30:00Z',
    required: false,
    nullable: true,
  })
  deletedAt?: Date | null

  @ApiProperty({
    description: 'Anexos do problema',
    type: [AttachmentInfo],
    required: false,
  })
  attachments?: AttachmentInfo[]
}

export class LocationResponse {
  @ApiProperty({
    description: 'ID da localização',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'Nome da localização',
    example: 'Bloco A - Sala 201',
  })
  name!: string

  @ApiProperty({
    description: 'Descrição da localização',
    example: 'Sala de aula localizada no primeiro andar do Bloco A',
  })
  description!: string

  @ApiProperty({
    description: 'Código identificador da localização',
    example: 'BLA-201',
  })
  code!: string

  @ApiProperty({
    description: 'Status ativo/inativo da localização',
    example: true,
  })
  isActive!: boolean

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt!: Date

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-01-15T10:30:00Z',
    required: false,
  })
  updatedAt?: Date

  @ApiProperty({
    description: 'Data de exclusão (null se não deletado)',
    example: '2025-01-15T10:30:00Z',
    required: false,
    nullable: true,
  })
  deletedAt?: Date | null
}

export class CategoryResponse {
  @ApiProperty({
    description: 'ID da categoria',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Climatização',
  })
  name!: string

  @ApiProperty({
    description: 'Descrição da categoria',
    example:
      'Problemas relacionados a ar condicionado, ventilação e climatização',
  })
  description!: string

  @ApiProperty({
    description: 'Status ativo/inativo da categoria',
    example: true,
  })
  isActive!: boolean

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt!: Date

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-01-15T10:30:00Z',
    required: false,
  })
  updatedAt?: Date

  @ApiProperty({
    description: 'Data de exclusão (null se não deletado)',
    example: '2025-01-15T10:30:00Z',
    required: false,
    nullable: true,
  })
  deletedAt?: Date | null
}
