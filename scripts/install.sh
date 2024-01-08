#!/bin/bash

set -eu

EXECUTION_DIRECTORY="$(dirname "$0")"
COMPOSE_FILE="$(realpath "$EXECUTION_DIRECTORY/../docker-compose.yml")"

docker-compose -f "$COMPOSE_FILE" run -u node --rm server npm i
docker-compose -f "$COMPOSE_FILE" up -d
