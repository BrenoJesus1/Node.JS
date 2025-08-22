import { beforeAll, afterAll, describe, it, expect, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app.js";

describe("Meals routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  it("O usuario consegue criar uma nova refeicao", async () => {
    await request(app.server)
      .post("/meals")
      .send({
        name: "Nova refeição",
        description: "Arroz e feijão",
        inOutDiet: "in",
      })
      .expect(201);
  });

  it("O usuario consegue listar todas as refeicoes", async () => {
    const createMealsResponse = await request(app.server).post("/meals").send({
      name: "Nova refeição",
      description: "Arroz e feijão",
      inOutDiet: "in",
    });

    const cookies = createMealsResponse.get("Set-Cookie");

    const listMealsResponse = await request(app.server)
      .get("/meals")
      .set("Cookie", cookies ?? [])
      .expect(200);

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: "Nova refeição",
        description: "Arroz e feijão",
      }),
    ]);
  });

  it("O usuario consegue pegar uma refeicao especifica", async () => {
    const createMealResponse = await request(app.server).post("/meals").send({
      name: "Nova refeição",
      description: "Arroz e feijão",
      inOutDiet: "in",
    });

    const cookies = createMealResponse.get("Set-Cookie");

    const listMealsResponse = await request(app.server)
      .get("/meals")
      .set("Cookie", cookies ?? [])
      .expect(200);

    const mealId = listMealsResponse.body.meals[0].id;

    const getTransactionResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set("Cookie", cookies ?? [])
      .expect(200);

    expect(getTransactionResponse.body.meals).toEqual(
      expect.objectContaining({
      name: "Nova refeição",
      description: "Arroz e feijão",
      })
    );
  });

  it("O usuário consegue trazer métricas", async () => {
    const createMealResponse = await request(app.server).post("/meals").send({
      name: "Café da manhã",
      description: "Salada e frango",
      inOutDiet: "in",
    });

    const cookies = createMealResponse.get("Set-Cookie");

    await request(app.server)
      .post("/meals")
      .set("Cookie", cookies ?? [])
      .send({
        name: "Almoço",
        description: "Hambúrguer e batata frita",
        inOutDiet: "out",
      });

    await request(app.server)
      .post("/meals")
      .set("Cookie", cookies ?? [])
      .send({
        name: "Janta",
        description: "Arroz integral e peixe",
        inOutDiet: "in",
      });

    const metricsResponse = await request(app.server)
      .get("/meals/metrics")
      .set("Cookie", cookies ?? [])
      .expect(200);

    expect(metricsResponse.body).toEqual({
      totalMeals: 3,
      mealsInDiet: 2,
      mealsOutDiet: 1,
      bestSequence: 1,
    });
  });
});
