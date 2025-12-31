import { pool } from '../utils/db.js';

/**
 * Obtiene el id_employee desde ME usando email e id_bu
 */
export const getEmployeeIdByEmailAndBu = async (email, id_bu) => {
 
  const sql = `
    SELECT id
    FROM me_employee
    WHERE email = ?
      AND bu = ?
    ORDER BY id DESC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [email, id_bu]);

  if (!rows.length) {
    return null; // importante
  }

  return rows[0].id;
};
