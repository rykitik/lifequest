# Базовый образ Node.js
FROM node:20-alpine

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь код
COPY . .

# Указываем порт
EXPOSE 3000

# Запуск
CMD ["npm", "run", "start"]
