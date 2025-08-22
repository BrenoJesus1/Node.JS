import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("meals", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.text("description").notNullable();
    table.timestamp("dateTime").notNullable();
    table
      .enum("inOutDiet", ["in", "out"], {
        useNative: true,
        enumName: "diet_status",
      })
      .notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("meals");
}
