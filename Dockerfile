# Usamos la imagen base OFICIAL de AWS para Lambda con Node 20
FROM public.ecr.aws/lambda/nodejs:20

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las librerías de producción (mysql2, etc.)
RUN npm install --omit=dev

# Copiamos TODO tu código fuente
# Ojo: LAMBDA_TASK_ROOT es una variable de entorno mágica de AWS (/var/task)
COPY src/ ${LAMBDA_TASK_ROOT}/src/
COPY index.js ${LAMBDA_TASK_ROOT}

# Comando de arranque: Apunta a tu archivo index.js y función handler
CMD [ "index.handler" ]
