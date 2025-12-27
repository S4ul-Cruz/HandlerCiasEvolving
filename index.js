/**
 * Obtiene la KEY_SECRET desde .env
 */
import dotenv from 'dotenv';
dotenv.config();

import * as ciaHandler from './src/handlers/ciaHandler.js';

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
   'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };

  const getHttpMethod = (event) =>
    event.requestContext?.http?.method || event.httpMethod;

  const getPath = (event) =>
    event.requestContext?.http?.path || event.rawPath || event.path;

  export const handler = async (event, context) => {
    const httpMethod = getHttpMethod(event);
    const path = getPath(event);

    console.log('METHOD:', httpMethod);
    console.log('PATH:', path);
  
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  if (path.endsWith('/companias') && httpMethod === 'GET') {
    return ciaHandler.getCiasHandler(event, context);
  }

  if (path.endsWith('/companias') && httpMethod === 'POST') {
    return ciaHandler.crearCiaHandler(event, context);
  }

  if (path.match(/\/companias\/\d+$/) && httpMethod === 'GET') {
    return ciaHandler.getCiaByIdHandler(event, context);
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Ruta no soportada', path, method: httpMethod })
  };
};
