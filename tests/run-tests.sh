#!/usr/bin/env bash

if [[ -z $LIVELY ]]; then
    if [[ ! -d "$PWD/LivelyKernel" ]]; then
        echo "Lively not yet installed installed in $LIVELY"
        git clone git://github.com/LivelyKernel/LivelyKernel.git
    fi
    export LIVELY="$PWD/LivelyKernel"
fi

node_modules/mocha/bin/mocha tests/test.js
