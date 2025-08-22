import type { FastifyInstance } from "fastify";
import { date, z } from "zod";
import { knex } from "../database.js";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";

export async function mealsRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      dateTime: z.string().default(() => {
        const now = new Date();
        return now.toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "America/Sao_Paulo",
        });
      }),
      inOutDiet: z.enum(["in", "out"]),
    });

    const { name, description, dateTime, inOutDiet } =
      createMealBodySchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, //7 days
      });
    }

    await knex("meals").insert({
      id: randomUUID(),
      name,
      description,
      dateTime,
      inOutDiet,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });

  app.delete(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      await knex("meals")
        .where({
          id,
          session_id: sessionId,
        })
        .del();

      return reply.status(201).send();
    }
  );

  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const meals = await knex("meals").where("session_id", sessionId).select();

      return {
        meals,
      };
    }
  );

  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealsParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      const meals = await knex("meals")
        .where({
          session_id: sessionId,
          id,
        })
        .first();

      return {
        meals,
      };
    }
  );

  app.get(
    "/metrics",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const totalMeals = await knex("meals")
        .where("session_id", sessionId)
        .count("id", { as: "count" })
        .first();

      const mealsInDiet = await knex("meals")
        .where({ session_id: sessionId, inOutDiet: "in" })
        .count("id", { as: "count" })
        .first();

      const mealsOutDiet = await knex("meals")
        .where({ session_id: sessionId, inOutDiet: "out" })
        .count("id", { as: "count" })
        .first();

      const allMeals = await knex("meals")
        .where("session_id", sessionId)
        .orderBy("dateTime", "asc")
        .select("inOutDiet");

      let bestSequence = 0;
      let currentSequence = 0;

      for (const meal of allMeals) {
        if (meal.inOutDiet === "in") {
          currentSequence++;
          if (currentSequence > bestSequence) {
            bestSequence = currentSequence;
          }
        } else {
          currentSequence = 0;
        }
      }

      return {
        totalMeals: totalMeals?.count ?? 0,
        mealsInDiet: mealsInDiet?.count ?? 0,
        mealsOutDiet: mealsOutDiet?.count ?? 0,
        bestSequence,
      };
    }
  );

  app.put(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        inOutDiet: z.enum(["in", "out"]).optional(),
      });

      const { id } = getMealParamsSchema.parse(request.params);
      const { name, description, inOutDiet } =
        updateMealBodySchema.parse(request.body);

      const { sessionId } = request.cookies;

      await knex("meals")
        .where({
          id,
          session_id: sessionId,
        })
        .update({
          name,
          description,
          inOutDiet,
        });

      return reply.status(200).send();
    }
  );
}
