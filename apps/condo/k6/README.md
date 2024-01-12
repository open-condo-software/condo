# Installation

## Native packages
### MacOS
```bash 
brew install k6
```

### Linux
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Docker image

```bash
docker pull grafana/k6:master-with-browser
```

# Run

## Native package

```bash
BASE_URL=http://localhost:3000 AUTH_EMAIL=user@example.com AUTH_PASSWORD=secret_example k6 run <path to script>
```

## Docker image

```bash
docker run --env-file="path/to/env.file" --rm -i grafana/k6:master-with-browser run - <path to script>
```

### Browser tests
K6 supports browser testing in both modes just like other e2e packages. 

For local debugging you can use `K6_BROWSER_HEADLESS=true` environment variable. 
