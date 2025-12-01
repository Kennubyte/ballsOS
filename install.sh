#!/usr/bin/env bash
echo Installing ballsOS
rm -rf /var/tmp/ballsOS

curl -fsSL https://bun.com/install | bash

git clone https://github.com/Kennubyte/ballsOS.git /var/tmp/ballsOS
cd /var/tmp/ballsOS

mkdir -p /opt/ballsOS/web-ui
cp -r management/* /opt/ballsOS/web-ui/

echo Cleaning up.
rm -rf /var/tmp/ballsOS
echo Installation complete!