import { Knex } from "knex";

declare module "knex/types/tables" {
  export interface Tables {
    meals: string;
    id: string;
    name: string;
    description: string;
    dateTime: string;
    inOutDiet: "in" | "out";
    session_id?: string;
  }
}