import { DeleteProblemUseCase } from "./delete-problem";
import { InMemoryProblemsRepository } from "test/repositories/in-memory-problems-repository";
import { makeProblem } from "test/factories/make-problem";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { InMemoryProblemAttachmentsRepository } from "test/repositories/in-memory-problem-attachments-repository";
import { makeProblemAttachment } from "test/factories/make-problem-attachments";

let inMemoryProblemsRepository: InMemoryProblemsRepository;
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository;
let sut: DeleteProblemUseCase;

describe("Delete Problem", () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository();
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    );
    sut = new DeleteProblemUseCase(inMemoryProblemsRepository);
  });

  it("should be able to delete a problem", async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID("reporter-1"),
      },
      new UniqueEntityID("problem-1"),
    );

    await inMemoryProblemsRepository.create(newProblem);

    inMemoryProblemAttachmentsRepository.items.push(
      makeProblemAttachment({
        problemId: newProblem.id,
        attachmentId: new UniqueEntityID("1"),
      }),
      makeProblemAttachment({
        problemId: newProblem.id,
        attachmentId: new UniqueEntityID("2"),
      }),
    );

    await sut.execute({
      problemId: "problem-1",
      reporterId: "reporter-1",
    });

    expect(inMemoryProblemsRepository.items).toHaveLength(0);
    expect(inMemoryProblemAttachmentsRepository.items).toHaveLength(0);
  });

  it("should not be able to delete a problem from another user", async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID("reporter-1"),
      },
      new UniqueEntityID("problem-1"),
    );

    await inMemoryProblemsRepository.create(newProblem);

    const result = await sut.execute({
      problemId: "problem-1",
      reporterId: "reporter-2",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
