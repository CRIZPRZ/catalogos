# Etapa de construcción
FROM node:18-alpine as build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --silent

# Copiar el resto del código
COPY . .

# Construir la aplicación (Vite genera carpeta 'dist')
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar build desde la etapa anterior (Vite usa 'dist' no 'build')
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]