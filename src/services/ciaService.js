import * as ciaRepository from '../repositories/ciaRepository.js';
import { validateJWT, validateSecurityAccess } from './authService.js';

/**
 * 
 * @param {*} event 
 * @returns
 * Obtiene lista de compañias y valida permisos para mostrar la lista 
 */
export const getCias = async (event) => { 
  // Validar JWT
  const user = validateJWT(event);

  console.log("idEmployee en sesion: ",user.id_employee);
  // Validar permisos
  await validateSecurityAccess(user.id_employee);

  // Consultar datos planos
  const data = await ciaRepository.getCias(user.id_employee);

  // Agrupar por compañía
  const grouped = {};

  data.forEach(item => {
    const idCia = item.id_cia;

    if (!grouped[idCia]) {
      grouped[idCia] = {
        compania: {
          id_cia: idCia,
          nombreCia: item.nombreCia,
          numeroEmpleados: 0,
          status: item.statusCia === 1 ? 'ACTIVO' : 'INACTIVO'
        },
        empleados: []
      };
    }

    // Evitar duplicados por idEmpleado
    if (!grouped[idCia].empleados.some(e => e.idEmpleado === item.idEmpleado)) {
      grouped[idCia].empleados.push({
        idEmpleado: item.idEmpleado,
        nombre: item.full_name,
        estatus: item.statusMe === 1 ? 'ACTIVO' : 'INACTIVO',
        esAdmin: item.role === 'ADMIN'
      });

      grouped[idCia].compania.numeroEmpleados += 1;
    }
  });

  const finalJson = Object.values(grouped);

  return {
    statusCode: 200,
    body: JSON.stringify(finalJson, null, 2)
  };
};

 
/**
 * Crea una nueva compañía
 * @param {*} event - Request de AWS Lambda
 */
export const createCia = async (user, ciaData) => {

  //valida acceso
  await validateSecurityAccess(user.id_employee);

  if (!ciaData.Name_ || !ciaData.IdSimpleCatalog) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltan campos obligatorios' }) };
  }

  try {
    const response = await ciaRepository.insertCia(ciaData, user.id_employee);
    return {
      statusCode: 201,
      body: JSON.stringify(response, null, 2)
    };
  } catch (err) {
    console.error('Error createCia:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al crear compañía', details: err.message })
    };
  }
};
