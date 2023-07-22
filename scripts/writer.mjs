import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";

const secret = readFileSync(".data/secret.txt", "utf8").trim();

for await (const line of createInterface({ input: process.stdin })) {
  if (line.trim()) {
    try {
      const body = JSON.parse(line);
      console.log(body.text);
      await fetch("http://127.0.0.1:7826/transcription", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error(e);
    }
  }
}
