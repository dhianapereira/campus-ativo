import { UsersRepository } from "@/domain/accounts/application/repositories/users-repository";
import { User } from "@/domain/accounts/enterprise/entities/user";
import { UserSummary } from "@/domain/accounts/enterprise/entities/user-summary";

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    const user = this.items.find((item) => item.email === email);

    if (!user) {
      return null;
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((item) => item.id.toString() === id);

    if (!user) {
      return null;
    }

    return user;
  }

  async findByIdForListing(id: string): Promise<UserSummary | null> {
    const user = this.items.find((item) => item.id.toString() === id);

    if (!user) {
      return null;
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
    );
  }

  async create(user: User): Promise<void> {
    this.items.push(user);
  }

  async save(user: User): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === user.id);

    this.items[itemIndex] = user;
  }

  async findMany(): Promise<User[]> {
    return this.items;
  }

  async findManyForListing(): Promise<UserSummary[]> {
    return this.items.map((user) =>
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
    );
  }
}
