import { getConfigByKey } from '../repositories/configurationRepository.js';
import { postRequest } from './httpService.js';
import { getEmployeeIdByEmailAndBu } from '../repositories/meRepository.js';

/**
 * Este servicio crea el usuario default en ME
 */
export const createDefaultMeUser = async ({ jwt, id_bu }) => {

  let url = await getConfigByKey('REST_CREAR_USUARIO_DEFAULT');

  // Reemplazar placeholders en la URL
  url = url
    .replace('<Cambiame>', encodeURIComponent(jwt))
    .replace('<Cambiame>', id_bu);

  console.log('URL final ME:', url);

  // ME crea el empleado default
  await postRequest(url, new URLSearchParams());

  //No  devulve idEmpleado, se obtiene desde la bd en la funcion resolveMeEmployeeId
  return true;
};

/**
 *  Obtiene el idEmpleado nuevo en ME a partir de email e id_bu 
 */
export async function resolveMeEmployeeId({ email, id_bu }) {

  if (!email || !id_bu) {
    throw new Error('email o id_bu no definidos');
  }

  console.log('[resolveMeEmployeeId]', { email, id_bu });

  // Obtener id_employee desde la BD ME y reyornarlo
  const id = await getEmployeeIdByEmailAndBu(email, id_bu);

  if (!id) {
    throw new Error(`No se encontró employee para email ${email} en BU ${id_bu}`);
  }

  return id;
}
