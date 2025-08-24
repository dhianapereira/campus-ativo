import { makeUser } from "test/factories/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";
import { FetchUsersUseCase } from "./fetch-users";
import { UserRole } from "../../enterprise/entities/user";

let inMemoryUsersRepository: InMemoryUsersRepository;
let sut: FetchUsersUseCase;

describe("Fetch Users", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    sut = new FetchUsersUseCase(inMemoryUsersRepository);
  });

  it("should be able to fetch all users when current user is ADMIN", async () => {
    const user1 = makeUser({
      name: "John Doe",
      role: UserRole.REPORTER,
    });

    const user2 = makeUser({
      name: "Jane Doe",
      role: UserRole.MANAGER,
    });

    const user3 = makeUser({
      name: "Bob Smith",
      role: UserRole.DIRECTOR,
    });

    const admin = makeUser({
      name: "Admin User",
      role: UserRole.ADMIN,
    });

    inMemoryUsersRepository.items.push(user1, user2, user3, admin);

    const result = await sut.execute({ currentUserRole: UserRole.ADMIN });

    expect(result.isRight()).toBe(true);
    expect(result.value?.users).toHaveLength(4);
    expect(result.value?.users).toEqual([
      expect.objectContaining({ name: "John Doe", role: UserRole.REPORTER }),
      expect.objectContaining({ name: "Jane Doe", role: UserRole.MANAGER }),
      expect.objectContaining({ name: "Bob Smith", role: UserRole.DIRECTOR }),
      expect.objectContaining({ name: "Admin User", role: UserRole.ADMIN }),
    ]);
  });

  it("should filter out ADMIN users when current user is DIRECTOR", async () => {
    const user1 = makeUser({
      name: "John Doe",
      role: UserRole.REPORTER,
    });

    const user2 = makeUser({
      name: "Jane Doe",
      role: UserRole.MANAGER,
    });

    const user3 = makeUser({
      name: "Bob Smith",
      role: UserRole.DIRECTOR,
    });

    const admin = makeUser({
      name: "Admin User",
      role: UserRole.ADMIN,
    });

    inMemoryUsersRepository.items.push(user1, user2, user3, admin);

    const result = await sut.execute({ currentUserRole: UserRole.DIRECTOR });

    expect(result.isRight()).toBe(true);
    expect(result.value?.users).toHaveLength(3);
    expect(result.value?.users).toEqual([
      expect.objectContaining({ name: "John Doe", role: UserRole.REPORTER }),
      expect.objectContaining({ name: "Jane Doe", role: UserRole.MANAGER }),
      expect.objectContaining({ name: "Bob Smith", role: UserRole.DIRECTOR }),
    ]);
    expect(result.value?.users).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: UserRole.ADMIN }),
      ]),
    );
  });

  it("should filter out ADMIN users when current user is MANAGER", async () => {
    const user1 = makeUser({
      name: "John Doe",
      role: UserRole.REPORTER,
    });

    const admin = makeUser({
      name: "Admin User",
      role: UserRole.ADMIN,
    });

    inMemoryUsersRepository.items.push(user1, admin);

    const result = await sut.execute({ currentUserRole: UserRole.MANAGER });

    expect(result.isRight()).toBe(true);
    expect(result.value?.users).toHaveLength(1);
    expect(result.value?.users).toEqual([
      expect.objectContaining({ name: "John Doe", role: UserRole.REPORTER }),
    ]);
  });

  it("should return empty array when no users exist", async () => {
    const result = await sut.execute({ currentUserRole: UserRole.DIRECTOR });

    expect(result.isRight()).toBe(true);
    expect(result.value?.users).toHaveLength(0);
  });

  it("should ensure passwords are not included in listing results", async () => {
    const user1 = makeUser({
      name: "John Doe",
      role: UserRole.REPORTER,
      password: "secret-password",
    });

    inMemoryUsersRepository.items.push(user1);

    const result = await sut.execute({ currentUserRole: UserRole.ADMIN });

    expect(result.isRight()).toBe(true);
    expect(result.value?.users).toHaveLength(1);
    // UserSummary doesn't have a password property at all - which is secure
    expect(result.value?.users[0]).not.toHaveProperty("password");
  });
});
