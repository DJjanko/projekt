#!/bin/bash

# Pull images from Docker Hub
docker pull djjanko/projekt_frontend-web:latest
docker pull djjanko/projekt_frontweb-mobile:latest


docker run -itd --rm --name frontend-web -p 3000:3000 djjanko/projekt_frontend-web:latest
docker run -it --rm --name frontweb-mobile --network host djjanko/projekt_frontweb-mobile:latest npm start

