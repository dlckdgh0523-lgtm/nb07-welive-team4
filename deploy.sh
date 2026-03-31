#!/usr/bin/env bash
set -e

cd ~/deploy/nb07-welive-team4

aws ecr get-login-password --region ap-northeast-2 \
| sudo docker login --username AWS --password-stdin 022038146145.dkr.ecr.ap-northeast-2.amazonaws.com

sudo docker compose pull
sudo docker compose up -d --remove-orphans
sudo docker image prune -f