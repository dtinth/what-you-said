#!/bin/bash

while true
do
  rec -b 16 -c 1 -t raw -e signed-integer - rate 16000 \
    | env TRANSCRIBE_ON_DEVICE_ONLY=1 transcriber \
    | node scripts/writer.mjs
  sleep 1
done