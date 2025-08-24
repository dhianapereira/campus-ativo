import { GetProblemBySlugUseCase } from "./get-problem-by-slug";
import { InMemoryProblemsRepository } from "test/repositories/in-memory-problems-repository";
import { Slug } from "@/domain/maintenance-problems/enterprise/entities/value-objects/slug";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { makeProblem } from "test/factories/make-problem";
import { InMemoryProblemAttachmentsRepository } from "test/repositories/in-memory-problem-attachments-repository";

let inMemoryProblemsRepository: InMemoryProblemsRepository;
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository;
let sut: GetProblemBySlugUseCase;

describe("Get Problem By Slug", () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository();
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    );
    sut = new GetProblemBySlugUseCase(inMemoryProblemsRepository);
  });

  it("should be able to get a problem by slug", async () => {
    const newProblem = makeProblem({
      reporterId: new UniqueEntityID(),
      title: "Example Problem",
      slug: Slug.create("example-problem"),
      description: "Example description",
    });

    await inMemoryProblemsRepository.create(newProblem);

    const result = await sut.execute({
      slug: "example-problem",
    });
    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({
      problem: expect.objectContaining({
        title: newProblem.title,
      }),
    });
  });
});
