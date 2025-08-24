import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { LocationFactory } from "test/factories/make-location";
import { UserFactory } from "test/factories/make-user";

describe("Fetch locations (E2E)", () => {
  let app: INestApplication;
  let jwt: JwtService;

  let userFactory: UserFactory;
  let locationFactory: LocationFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, LocationFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    userFactory = moduleRef.get(UserFactory);
    locationFactory = moduleRef.get(LocationFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  test("[GET] /locations", async () => {
    const user = await userFactory.makePrismaUser();

    const accessToken = jwt.sign({ sub: user.id.toValue() });

    await Promise.all([
      locationFactory.makePrismaLocation({
        name: "Location 01",
      }),
      locationFactory.makePrismaLocation({
        name: "Location 02",
      }),
    ]);

    const response = await request(app.getHttpServer())
      .get("/locations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      locations: expect.arrayContaining([
        expect.objectContaining({ name: "Location 01" }),
        expect.objectContaining({ name: "Location 02" }),
      ]),
    });
  });
});
