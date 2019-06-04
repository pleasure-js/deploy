# build docker ui image

```sh
docker build -t myapp/ui -f Dockerfile-ui my-app
```

# build docker api image

```sh
docker build -t myapp/api -f Dockerfile-api my-api
```

# run ui image

```sh
docker run -p 8080:80 -t myapp/ui
```

# run api image

```sh
docker run -p 3000:3000 -t myapp/api
```
