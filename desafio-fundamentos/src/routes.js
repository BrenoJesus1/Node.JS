import { Database } from "./database.js";
import { randomUUID } from "crypto";
import { buildRoutePath } from "./utils/build-route-path.js";

const database = new Database();
const now = new Date();

export const routes = [
  {
    method: "POST",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { title, description, created_at, updated_at, completed_at } =
        req.body;

      const task = {
        id: randomUUID(),
        title,
        description,
        created_at: now.toLocaleString("pt-Br", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "America/Sao_Paulo"
        }),
        updated_at: null,
        completed_at: null,
      };

      database.insert("tasks", task);

      return res.writeHead(201).end();
    },
  },
  {
    method: "GET",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { search } = req.query;

      const tasks = database.select(
        "tasks",
        search
          ? (task) =>
              task.title.includes(search) || task.description.includes(search)
          : null
      );

      return res.end(JSON.stringify(tasks));
    },
  },
  {
    method: "PUT",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params;
      const { title, description, updated_at } = req.body;

      database.update("tasks", id, {
        title,
        description,
        updated_at: now.toLocaleString("pt-Br", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "America/Sao_Paulo"
        }),
      });

      return res.writeHead(204).end();
    },
  },
  {
    method: "DELETE",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params;

      database.delete("tasks", id);

      return res.writeHead(204).end();
    },
  },
  {
    method: "PATCH",
    path: buildRoutePath("/tasks/:id/complete"),
    handler: (req, res) => {
      const { id } = req.params;

      database.update("tasks", id, {
        completed_at: now.toLocaleString("pt-Br", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "America/Sao_Paulo"
        }),
        updated_at: now.toLocaleString("pt-Br", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "America/Sao_Paulo"
        }),
      });

      return res.writeHead(204).end();
    },
  },
];
