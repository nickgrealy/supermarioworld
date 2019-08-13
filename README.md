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