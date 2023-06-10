#!/usr/bin/env bash
git switch dev/beta
git pull
git merge --squash -s ort -Xtheirs origin/translation/l10n 