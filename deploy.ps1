# Удалить текущий стек
docker stack rm token-service

# Подождать, пока стек полностью удалится
Start-Sleep -Seconds 5

# Очистить неиспользуемые образы
docker image prune -a -f

# Создать тег
$env:TAG = Get-Date -Format "yyyyMMdd-HHmmss"

# Построить образы
docker build -t token-service-api-gateway:$env:TAG ./api-gateway

docker build -t token-service-transfer-service:$env:TAG ./transfer-service

docker build -t token-service-balance-service:$env:TAG ./balance-service

docker build -t token-service-gas-service:$env:TAG ./gas-service

# Задеплоить стек
docker stack deploy -c docker-compose-stack.yml token-service

# Показать список сервисов
Start-Sleep -Seconds 10
docker service ls
docker ps
