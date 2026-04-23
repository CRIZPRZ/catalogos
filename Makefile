.PHONY: up down build restart logs sh npm dev prod install clean test lint format

# Levantar contenedor de desarrollo
up:
	docker compose up react-dev -d

# Detener contenedores
down:
	docker compose down

# Construir imágenes
build:
	docker compose build

# Reiniciar contenedores
restart:
	docker compose down
	docker compose up react-dev -d

# Ver logs en tiempo real
logs:
	docker compose logs -f react-dev

# Acceder a shell del contenedor
sh:
	docker compose exec react-dev sh

# Ejecutar comandos npm
npm:
	docker compose exec react-dev npm $(filter-out $@,$(MAKECMDGOALS))

# Modo desarrollo (con hot reload)
dev:
	docker compose up react-dev

# Modo producción
prod:
	docker compose up react-app --build -d

# Instalar dependencias
install:
	docker compose run --rm react-dev npm install

# Limpiar node_modules y reinstalar
clean:
	docker compose run --rm react-dev rm -rf node_modules
	docker compose run --rm react-dev npm install

# Ejecutar tests (si usas Vitest o Jest)
test:
	docker compose exec react-dev npm run test

# Ejecutar linter
lint:
	docker compose exec react-dev npm run lint

# Formatear código (si usas Prettier)
format:
	docker compose exec react-dev npm run format

# Build de producción
build-app:
	docker compose run --rm react-dev npm run build

# Preview de build de producción
preview:
	docker compose exec react-dev npm run preview

# Actualizar dependencias
update:
	docker compose exec react-dev npm update

# Agregar dependencia
add:
	docker compose exec react-dev npm install $(filter-out $@,$(MAKECMDGOALS))

# Agregar dependencia de desarrollo
add-dev:
	docker compose exec react-dev npm install -D $(filter-out $@,$(MAKECMDGOALS))

# Eliminar dependencia
remove:
	docker compose exec react-dev npm uninstall $(filter-out $@,$(MAKECMDGOALS))

# Evitar errores con argumentos
%:
	@: