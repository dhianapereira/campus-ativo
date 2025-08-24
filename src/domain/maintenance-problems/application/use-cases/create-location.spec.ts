import { CreateLocationUseCase } from "./create-location";
import { InMemoryLocationsRepository } from "test/repositories/in-memory-locations-repository";

let inMemoryLocationsRepository: InMemoryLocationsRepository;
let sut: CreateLocationUseCase;

describe("Create Location", () => {
  beforeEach(() => {
    inMemoryLocationsRepository = new InMemoryLocationsRepository();
    sut = new CreateLocationUseCase(inMemoryLocationsRepository);
  });

  it("should be able to create a location", async () => {
    const result = await sut.execute({
      name: "Nova Localização",
      description: "Descrição do local",
      code: "X01",
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryLocationsRepository.items[0]).toEqual(
      result.value?.location,
    );
  });
});
