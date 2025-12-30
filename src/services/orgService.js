// services/orgService.js
import { getConfigByKey } from '../repositories/configurationRepository.js';
import { postRequest } from './httpService.js';

export const createDefaultOrg = async ({ jwt, idEmployeeNuevo, id_bu }) => {
  let url = await getConfigByKey('REST_CREAR_ORG_DEFAULT');

  url = url
    .replace('jwt=', `jwt=${jwt}`)
    .replace('idEmployeeNuevo=', `idEmployeeNuevo=${idEmployeeNuevo}`)
    .concat(`&id_bu=${id_bu}`);


    console.log('Llamando a URL de creación de org:', url, { jwt, idEmployeeNuevo, id_bu });

  return postRequest(url);
};
