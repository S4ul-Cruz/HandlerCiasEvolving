import * as ciaService from '../services/ciaService.js';
import { getUserFromEvent } from '../services/authService.js';

/**
 * 
 * @param {*} event 
 * @returns 
 * Handler para obtener lista de compañías
 */
export const getCiasHandler = async (event) => {
  try {
    const data = await ciaService.getCias(event);
    return data;
  } catch (err) {
    console.error('Error getCiasHandler:', err);
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

/**
 * Handler para crear compañía
 */
export const crearCiaHandler = async (event) => {
 
  try {
 
    const user = getUserFromEvent(event);             // valida una vez
    const body = JSON.parse(event.body);         // parsea body JSON
    return await ciaService.createCia(user, body); // pasa user y body

  } catch (err) {
    console.error('Error crearCiaHandler:', err);
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};