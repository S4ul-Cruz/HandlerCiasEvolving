// repositories/configurationRepository.js
import { pool } from '../utils/db.js';

export const getConfigByKey = async (key) => {
  const [rows] = await pool.query(`
    SELECT value
    FROM me_configuration_evolving
    WHERE key_conf = ?
    LIMIT 1
  `, [key]);

  if (!rows.length) {
    throw new Error(`Configuración no encontrada: ${key}`);
  }

  console.log(`Configuración obtenida - ${key}: ${rows[0].value}`);
  
  return rows[0].value;
};
