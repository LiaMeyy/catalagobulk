# Imagen única para la API y el worker (se diferencian solo por el `command` en compose).
# Se usa node:20-slim (Debian/glibc) en vez de alpine para que bcrypt use sus binarios
# precompilados sin necesidad de toolchain de compilación (g++/make/python).
FROM node:20-slim

WORKDIR /app

# Instalar solo dependencias de producción (usa el lock para builds reproducibles).
COPY src/package.json src/package-lock.json ./
RUN npm ci --omit=dev

# Copiar el código de la app (node_modules ya viene del npm ci anterior).
COPY src/ ./

EXPOSE 3000

CMD ["node", "server.js"]
