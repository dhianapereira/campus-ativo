import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { User } from '@/domain/accounts/enterprise/entities/user'
import { UserSummary } from '@/domain/accounts/enterprise/entities/user-summary'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async findByEmail(email: string): Promise<User | null> {
    const user = this.items.find((item) => item.email === email)

    if (!user) {
      return null
    }

    return user
  }

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((item) => item.id.toValue() === id)

    if (!user) {
      return null
    }

    return user
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return []
    }

    return this.items.filter((item) => ids.includes(item.id.toValue()))
  }

  async findByIdForListing(id: string): Promise<UserSummary | null> {
    const user = this.items.find((item) => item.id.toValue() === id)

    if (!user) {
      return null
    }

    return UserSummary.create(
      {
        name: user.name,
        position: user.position,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      user.id,
    )
  }

  async create(user: User): Promise<void> {
    this.items.push(user)
  }

  async save(user: User): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === user.id)

    this.items[itemIndex] = user
  }

  async delete(user: User): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === user.id)

    this.items.splice(itemIndex, 1)
  }

  async findMany(): Promise<User[]> {
    return this.items
  }

  async findManyForListing(
    params?: import('@/domain/accounts/application/repositories/users-repository').FetchUsersParams,
  ): Promise<UserSummary[]> {
    let users = this.items

    // Filter by isActive
    if (params?.isActive !== undefined) {
      users = users.filter((user) => user.isActive === params.isActive)
    }

    // Filter by query (case-insensitive search in name and email)
    if (params?.query) {
      const lowerQuery = params.query.toLowerCase()
      users = users.filter((user) => {
        const nameMatch = user.name.toLowerCase().includes(lowerQuery)
        const emailMatch = user.email.toLowerCase().includes(lowerQuery)
        return nameMatch || emailMatch
      })
    }

    // Sort: active users first, then by name
    users = users.sort((a, b) => {
      // First, sort by isActive (active users first)
      if (a.isActive !== b.isActive) {
        return a.isActive
          ? -1
          : 1
      }
      // Then, sort by name alphabetically
      return a.name.localeCompare(b.name)
    })

    return users.map((user) =>
      UserSummary.create(
        {
          name: user.name,
          position: user.position,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
        user.id,
      ),
    )
  }
}
