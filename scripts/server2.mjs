import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { atom, onMount } from "nanostores";
import { createWorker } from "./createWorker.mjs";
import Debug from "debug";
import chalk from "chalk";

const debug = Debug("server");

mkdirSync(".data", { recursive: true });
if (!existsSync(".data/secret.txt")) {
  writeFileSync(".data/secret.txt", randomUUID());
}

const secret = readFileSync(".data/secret.txt", "utf8").trim();
const fastify = Fastify();

function checkSecret(request) {
  const authorization = request.headers.authorization;
  if (authorization !== `Bearer ${secret}`) {
    throw new Error("Unauthorized");
  }
}

const store = atom({
  time: "-",
  result: null,
});

const worker = (() => {
  let count = 0;
  let worker = null;
  let grace = null;

  const check = () => {
    if (count > 0 && !worker) {
      if (grace) {
        debug("Restore");
        clearTimeout(grace.timeout);
        worker = grace.worker;
        grace = null;
      } else {
        debug("Create");
        console.log();
        console.log(chalk.greenBright("=> Start listening"), new Date().toISOString());
        const controller = new AbortController();
        createWorker(controller.signal, (result) => {
          store.set({
            ...store.get(),
            time: new Date().toISOString(),
            ...result,
          });
        });
        worker = controller;
      }
    } else if (count === 0 && worker) {
      debug("Prepare to abort");
      const timeout = setTimeout(() => {
        if (grace === current) {
          debug("Abort");
          console.log();
          console.log(chalk.cyanBright("=> Finish listening"), new Date().toISOString());
          current.worker.abort();
          grace = null;
        }
      }, 1000);
      const current = { worker, timeout };
      grace = current;
      worker = null;
    }
  };

  return {
    inc: () => {
      count++;
      check();
    },
    dec: () => {
      count--;
      check();
    },
  };
})();

onMount(store, () => {
  debug("Inc");
  worker.inc();
  return () => {
    debug("Dec");
    worker.dec();
  };
});

fastify.get("/transcription", async (request) => {
  checkSecret(request);
  return store.get();
});

fastify.get("/poll", async (request) => {
  checkSecret(request);
  const time = request.query.time;
  await new Promise((resolve) => {
    let timedOut = false;
    const check = () => {
      if (store.get().time !== time || timedOut) {
        resolve();
        unsubscribe();
      }
    };
    const unsubscribe = store.listen(check);
    check();
    setTimeout(() => {
      timedOut = true;
      check();
    }, 2000);
  });
  return store.get();
});

fastify.listen({ port: 7826, host: "127.0.0.1" });
