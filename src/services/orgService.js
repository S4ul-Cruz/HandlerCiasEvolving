import { getConfigByKey } from '../repositories/configurationRepository.js';
import { postRequest } from './httpService.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Esta clave debe ser la misma que ORG usa para verificar JWT
const ORG_JWT_SECRET = process.env.JWT_SECRET;
const ORG_JWT_EXP = '1h'; // Expira en 1 hora

/**
 * Genera un JWT válido para ORG
 */
const generateOrgJWT = (idEmployee) => {

  //Cambiar 'id_employee' por la variable si ORG lo requiere
  const payload = {
    id_employee: idEmployee // ORG espera 'id_employee' como claim
  };
  return jwt.sign(payload, ORG_JWT_SECRET, { expiresIn: ORG_JWT_EXP });
};

/**
 * Crea una organización por defecto en el sistema ORG
 * @param {Object} params
 * @param {string} params.jwt - JWT del usuario autenticado
 * @param {number} params.idEmployeeNuevo - ID del nuevo empleado
 * @param {number} params.id_bu - ID de la unidad de negocio
 * @return {Promise} - Respuesta de la petición POST
 */
export const createDefaultOrg = async ({ id_employeeSesion, idEmployeeNuevo, id_bu }) => {

  try {
    // Obtener URL base de la configuración
    let url = await getConfigByKey('REST_CREAR_ORG_DEFAULT');

    // Generar JWT
    const jwtForOrg = generateOrgJWT(id_employeeSesion);

    // Reemplazar placeholders en la URL
    url = url
      .replace('<JWT>', encodeURIComponent(jwtForOrg))
      .replace('<ID_EMPLOYEE>', idEmployeeNuevo)
      .concat(`&idBuNuevo=${id_bu}`);

    console.log('URL final ORG:', url);

    // Llamada POST a ORG
    const resp = await postRequest(url, new URLSearchParams(), { method: 'POST' });

    // Si ORG devuelve HTML en vez de JSON, capturarlo
    if (typeof resp === 'string') {
      console.warn('ORG respondió con contenido no JSON:', resp);
      return { success: false, message: 'ORG respondió con HTML de error', raw: resp };
    }

    return { success: true, data: resp };
  } catch (err) {
    console.error('Error al crear ORG:', err.response || err);
    return { success: false, message: 'Error al crear ORG', error: err.message || err };
  }
};