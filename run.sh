#!/bin/bash
pkg install nodejs -y
pkg install git -y
git clone https://github.com/Runc2333/Node.js-MiWiFi-Mesh-2.4G-5G-Separator
cd Node.js-MiWiFi-Mesh-2.4G-5G-Separator
npm install
node app.js