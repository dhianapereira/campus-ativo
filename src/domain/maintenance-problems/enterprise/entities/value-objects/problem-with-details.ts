import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from './slug'

export interface ProblemWithDetailsProps {
  problemId: UniqueEntityID
  reporterId: UniqueEntityID | null
  title: string
  slug: Slug
  excerpt: string
  locationId: UniqueEntityID
  createdAt: Date
  updatedAt?: Date | null
  deletedAt?: Date | null
}

export class ProblemWithDetails {
  public problemId: UniqueEntityID
  public reporterId: UniqueEntityID | null
  public title: string
  public slug: Slug
  public excerpt: string
  public locationId: UniqueEntityID
  public createdAt: Date
  public updatedAt?: Date | null
  public deletedAt?: Date | null

  constructor(props: ProblemWithDetailsProps) {
    this.problemId = props.problemId
    this.reporterId = props.reporterId
    this.title = props.title
    this.slug = props.slug
    this.excerpt = props.excerpt
    this.locationId = props.locationId
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.deletedAt = props.deletedAt
  }
}
