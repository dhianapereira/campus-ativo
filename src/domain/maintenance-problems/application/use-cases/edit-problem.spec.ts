import { EditProblemUseCase } from "./edit-problem";
import { InMemoryProblemsRepository } from "test/repositories/in-memory-problems-repository";
import { makeProblem } from "test/factories/make-problem";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { InMemoryProblemAttachmentsRepository } from "test/repositories/in-memory-problem-attachments-repository";
import { makeProblemAttachment } from "test/factories/make-problem-attachments";

let inMemoryProblemsRepository: InMemoryProblemsRepository;
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository;
let sut: EditProblemUseCase;

describe("Edit Problem", () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository();
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    );
    sut = new EditProblemUseCase(
      inMemoryProblemsRepository,
      inMemoryProblemAttachmentsRepository,
    );
  });

  it("should be able to edit a problem", async () => {
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
      problemId: newProblem.id.toValue(),
      reporterId: "reporter-1",
      title: "Problema teste",
      description: "Descrição teste",
      attachmentsIds: ["1", "3"],
    });

    expect(inMemoryProblemsRepository.items[0]).toMatchObject({
      title: "Problema teste",
      description: "Descrição teste",
    });
    expect(
      inMemoryProblemsRepository.items[0].attachments.currentItems,
    ).toHaveLength(2);
    expect(
      inMemoryProblemsRepository.items[0].attachments.currentItems,
    ).toEqual([
      expect.objectContaining({ attachmentId: new UniqueEntityID("1") }),
      expect.objectContaining({ attachmentId: new UniqueEntityID("3") }),
    ]);
  });

  it("should not be able to edit a problem from another user", async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID("reporter-1"),
      },
      new UniqueEntityID("problem-1"),
    );

    await inMemoryProblemsRepository.create(newProblem);

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: "reporter-2",
      title: "Problema teste",
      description: "Descrição teste",
      attachmentsIds: [],
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
