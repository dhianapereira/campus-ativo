import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from './slug'

export interface ProblemWithDetailsProps {
  problemId: UniqueEntityID
  title: string
  slug: Slug
  excerpt: string
  locationId: UniqueEntityID
  locationName: string
  createdAt: Date
  updatedAt?: Date | null
}

export class ProblemWithDetails {
  public problemId: UniqueEntityID
  public title: string
  public slug: Slug
  public excerpt: string
  public locationId: UniqueEntityID
  public locationName: string
  public createdAt: Date
  public updatedAt?: Date | null

  constructor(props: ProblemWithDetailsProps) {
    this.problemId = props.problemId
    this.title = props.title
    this.slug = props.slug
    this.excerpt = props.excerpt
    this.locationId = props.locationId
    this.locationName = props.locationName
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }
}
