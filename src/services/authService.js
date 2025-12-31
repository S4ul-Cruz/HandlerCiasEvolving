import jwt from 'jsonwebtoken';
import { pool } from '../utils/db.js';

/**
 * Valida y decodifica un JWT
 */
export const validateJWT = (event) => {

  const auth = event.headers?.authorization || event.headers?.Authorization;

  // Validar existencia del header
  if (!auth) {
    const e = new Error('Authorization header missing');
    e.statusCode = 401;
    throw e;
  }


  if (!auth.startsWith('Bearer ')) {
    const e = new Error('Invalid Authorization format');
    e.statusCode = 401;
    throw e;
  }

  const token = auth.replace(/^Bearer\s+/i, '').trim();
  
  //blindaje mínimo contra tokens malformados
  if (token.split('.').length !== 3) {
    const e = new Error('Malformed JWT');
    e.statusCode = 401;
    throw e;
  }

  try {
    console.log('Token recibido:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);

    if (!decoded.id_employee) {
      const e = new Error('id_employee missing in token');
      e.statusCode = 401;
      throw e;
    }

    return decoded;
  } catch {
    const e = new Error('Invalid token');
    e.statusCode = 401;
    throw e;
  }
};

/**
 * Obtiene usuario desde event y agrega JWT completo
 * Usa un valor por defecto solo en desarrollo si no hay Authorization header
 */
export const getUserFromEvent = (event) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;

  if (!authHeader) {
    // Solo para desarrollo local
    console.warn('Authorization header missing, usando user default para desarrollo');
    return { id_employee: 1, jwt: 'dev-token' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    const e = new Error('Invalid Authorization header format');
    e.statusCode = 401;
    throw e;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const decoded = validateJWT({ headers: { authorization: `Bearer ${token}` } });
  return { ...decoded, jwt: token };
};

/**
 * Valida acceso a apps y roles
 */
export const validateSecurityAccess = async (
  idEmployee,
  apps = ['ORG','ADMIN_LINK','ME','ADMIN_ADMIN','FM_360','PMP'],
  roles = ['ADMIN']
) => {
  const sql = `
    SELECT 1
    FROM security_access
    WHERE id_employee = ?
      AND status = 1
      AND id_application IN (${apps.map(() => '?').join(',')})
      AND role IN (${roles.map(() => '?').join(',')})
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [
    idEmployee,
    ...apps,
    ...roles
  ]);

  if (!rows.length) {
    const e = new Error('Access denied');
    e.statusCode = 403;
    throw e;
  }
};
