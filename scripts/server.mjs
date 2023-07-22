import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync(".data", { recursive: true });
if (!existsSync(".data/secret.txt")) {
  writeFileSync(".data/secret.txt", randomUUID());
}

const secret = readFileSync(".data/secret.txt", "utf8").trim();

const fastify = Fastify();
const observers = new Set();
let latestResult;

function checkSecret(request) {
  const authorization = request.headers.authorization;
  if (authorization !== `Bearer ${secret}`) {
    throw new Error("Unauthorized");
  }
}

fastify.put("/transcription", async (request) => {
  checkSecret(request);
  const time = new Date().toISOString();
  const result = request.body;
  console.log(time, result.text);
  latestResult = { time, result };
  observers.forEach((observer) => observer());
});

fastify.get("/transcription", async (request) => {
  checkSecret(request);
  return latestResult;
});

fastify.get("/poll", async (request) => {
  checkSecret(request);
  const time = request.query.time;
  await new Promise((resolve) => {
    const check = () => {
      if (latestResult && latestResult.time !== time) {
        resolve();
        observers.delete(check);
      }
    };
    check();
    observers.add(check);
  });
  return latestResult;
});

fastify.listen({ port: 7826, host: "127.0.0.1" });
