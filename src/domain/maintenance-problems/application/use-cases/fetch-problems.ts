import { Problem } from "@/domain/maintenance-problems/enterprise/entities/problems/problem";
import { ProblemsRepository } from "../repositories/problems-repository";
import { right, Either } from "@/core/either";
import { Injectable } from "@nestjs/common";

interface FetchProblemsUseCaseRequest {
  page: number;
}

type FetchProblemsUseCaseResponse = Either<
  null,
  {
    problems: Problem[];
  }
>;

@Injectable()
export class FetchProblemsUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    page,
  }: FetchProblemsUseCaseRequest): Promise<FetchProblemsUseCaseResponse> {
    const problems = await this.problemsRepository.findMany({ page });

    return right({
      problems,
    });
  }
}
