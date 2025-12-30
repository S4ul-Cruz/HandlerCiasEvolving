// services/meService.js
import { getConfigByKey } from '../repositories/configurationRepository.js';
import { postRequest } from './httpService.js';

/**
 * Este servicio crea el usuario default en ME
 */
export const createDefaultMeUser = async ({ jwt, id_bu }) => {
  let url = await getConfigByKey('REST_CREAR_USUARIO_DEFAULT');

  // Reemplazar parámetros dinámicos
  url = url
    .replace('<Cambiame>', jwt)
    .replace('<Cambiame>', id_bu);

  const response = await postRequest(url);

  /**
   * ⚠️ VALIDAR
   * Aquí asumo que ME regresa algo como:
   * { idEmployee: 1201 }
   */
  if (!response.idEmployee) {
    throw new Error('ME no regresó idEmployee');
  }

  console.log('Usuario default ME creado con idEmployee:', response.idEmployee);
  
  return response.idEmployee;
};
