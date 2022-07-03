#!/usr/bin/env bash

echo "Check setFakeClientMode: you can't use it inside *.test.js files. But you can use it inside *.spec.js files!"
! grep --include=\*.test.js -rnw . -e "setFakeClientMode"
