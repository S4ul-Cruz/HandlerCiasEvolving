import * as ciaRepository from '../repositories/ciaRepository.js';
import { getUserFromEvent, validateSecurityAccess } from './authService.js';
import { createDefaultMeUser } from './meService.js';
import { createDefaultOrg } from './orgService.js';

/**
 * 
 * @param {*} event 
 * @returns
 * Obtiene lista de compañias y valida permisos para mostrar la lista 
 */
export const getCias = async (event) => { 
  // Validar JWT
  const user = getUserFromEvent(event); // obtenemos id_employee + jwt

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
 
    const id_bu = response.insertId;
    const jwt = user.jwt; //token jwt del usuario en sesion

    console.log('ID de la nueva compañía (id_bu):', id_bu, ' y JWT del usuario:', jwt);
    
    //Crear usuario default ME
    const idEmployeeNuevo = await createDefaultMeUser({
      jwt,
      id_bu
    });

    //Crear estructura ORG
    await createDefaultOrg({
      jwt,
      idEmployeeNuevo,
      id_bu
    });
   
    return {
      statusCode: 201,
      body: JSON.stringify({ ...response, usuarioDefault: idEmployeeNuevo }, null, 2)
    };
  } catch (err) {
    console.error('Error createCia:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al crear compañía', details: err.message })
    };
  }
};
