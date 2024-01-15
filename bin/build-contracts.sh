#!/usr/bin/env bash
set -e

function generate-client() {
  echo "Generating client..."
  local arc32Files=$(find contracts/artifacts -name "*arc32*")

  for contract in $arc32Files; do
    local fileName=$(basename "$contract" .arc32.json | grep '.' | awk '{print $1}')
    local contractTSFileName="$fileName".ts
    algokitgen generate -a $contract -o contracts/clients/"$contractTSFileName"
  done
}

function compile_contracts() {
  echo "Building contracts..."
  for contract in contracts/*.ts; do
    echo "Compiling $contract"
    tealscript "$contract" contracts/artifacts
  done
}

compile_contracts
generate-client
exit 0
