import { createInterface } from "node:readline";
import { createWorker } from "./createWorker.mjs";

const controller = new AbortController();
const { signal } = controller;
createWorker(signal, console.log);

console.log("Press enter to exit");
for await (const _ of createInterface({ input: process.stdin })) {
  controller.abort();
  break;
}
