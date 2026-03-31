# Estágio de Servidor: Nginx Alpine (Leve e Seguro)
FROM nginx:alpine

# Copia os arquivos do projeto para o diretório do Nginx
COPY . /usr/share/nginx/html

# Exposição da porta padrão
EXPOSE 80

# O Nginx já inicia automaticamente pelo entrypoint da imagem base
