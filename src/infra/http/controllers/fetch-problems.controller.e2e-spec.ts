import { Slug } from "@/domain/maintenance-problems/enterprise/entities/value-objects/slug";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { CategoryFactory } from "test/factories/make-category";
import { LocationFactory } from "test/factories/make-location";
import { ProblemFactory } from "test/factories/make-problem";
import { UserFactory } from "test/factories/make-user";

describe("Fetch problems (E2E)", () => {
  let app: INestApplication;
  let jwt: JwtService;

  let userFactory: UserFactory;
  let problemFactory: ProblemFactory;
  let categoryFactory: CategoryFactory;
  let locationFactory: LocationFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        ProblemFactory,
        UserFactory,
        CategoryFactory,
        LocationFactory,
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    userFactory = moduleRef.get(UserFactory);
    problemFactory = moduleRef.get(ProblemFactory);
    categoryFactory = moduleRef.get(CategoryFactory);
    locationFactory = moduleRef.get(LocationFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  test("[GET] /problems", async () => {
    const user = await userFactory.makePrismaUser();

    const accessToken = jwt.sign({ sub: user.id.toValue() });

    const category = await categoryFactory.makePrismaCategory({
      name: "Category 01",
    });

    const location = await locationFactory.makePrismaLocation({
      name: "Location 01",
    });

    await Promise.all([
      problemFactory.makePrismaProblem({
        title: "Problem 01",
        description: "Problem content",
        reporterId: user.id,
        slug: Slug.create("problem-01"),
        locationId: location.id,
        categoryId: category.id,
      }),
      problemFactory.makePrismaProblem({
        title: "Problem 02",
        description: "Problem content",
        reporterId: user.id,
        slug: Slug.create("problem-02"),
        locationId: location.id,
        categoryId: category.id,
      }),
    ]);

    const response = await request(app.getHttpServer())
      .get("/problems")
      .set("Authorization", `Bearer ${accessToken}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      problems: expect.arrayContaining([
        expect.objectContaining({ title: "Problem 01" }),
        expect.objectContaining({ title: "Problem 02" }),
      ]),
    });
  });
});
