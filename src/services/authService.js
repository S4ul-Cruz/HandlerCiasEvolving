import jwt from 'jsonwebtoken';
import { pool } from '../utils/db.js';

/**
 * 
 * @param {*} event 
 * @returns 
 * valida jwt del usuario o empleado en sesion
 */
export const validateJWT = (event) => {
console.log('Headers recibidos:', event.headers);

  const auth = event.headers?.authorization || event.headers?.Authorization;
console.log('Authorization header:', auth);
  if (!auth) {
      console.error('Headers recibidos:', event.headers);

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
