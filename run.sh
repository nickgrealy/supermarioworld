#!/bin/sh

docker build . --tag mountainpass/infrastructure:supermarioworld-latest
docker run -it --rm -p 8080:80 mountainpass/infrastructure:supermarioworld-latest
