#!/bin/bash
cd "$(dirname "$0")/iopaint"
iopaint start --model=lama --device=cpu --port=8080
