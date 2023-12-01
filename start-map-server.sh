#!/bin/bash -e

docker run -p 3650:3650 -v "$(pwd)/.map-data/":/data/ maptiler/server
