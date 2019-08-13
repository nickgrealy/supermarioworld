# supermarioworld
Super mario in HTML.

# Instructions

Open `index.html` in a browser, then use `Left`, `Right` and `Spacebar` keys.

# Build and Run

```sh
docker build . --tag supermarioworld
docker run -it --rm -p 3000:80 supermarioworld
```

Then open http://localhost:3000/

# Todo

- make buttons look pressed
- move controls more friendly position
- support scrolling to follow player
- disable iphone window pinch zoom (stop touch events?)
- ensure images are preloaded on mobiles
- animate running