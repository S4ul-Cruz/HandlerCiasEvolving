import { pool } from '../utils/db.js';

/**
 * 
 * @returns 
 * Consulta para obtener lista de companias con respecto a la vista bu
 */
export const getCias = async () => {
  const [rows] = await pool.query(`
    SELECT 
      bu.key_bu id_cia,
      CAST(bu.status AS UNSIGNED) AS statusCia,
      bu.name nombreCia,
      me.id idEmpleado,
      me.full_name,
      me.status statusMe,
      sa.role,
      sa.id_application
    FROM v_me_bu bu
    LEFT JOIN orgchart o ON o.bu = bu.id_bu AND o.status = 1
    LEFT JOIN me_employee me ON me.id = o.employee_id AND me.status = 1
    INNER JOIN security_access sa ON sa.id_employee = me.id AND sa.status = 1
    WHERE bu.status = 1
    ORDER BY bu.id_bu, me.id
  `);

  return rows;
};

/**
 * Inserta una nueva compañía en la tabla me_cat_simplecatalogdetail
 * y actualiza id_bu con el id insertado
 * 
 * @param {Object} ciaData - Datos de la compañía
 * @param {number} userId - Id del empleado que crea la compañía
 * @returns {Object} - Información de la compañía creada
 */
export const insertCia = async (ciaData, userId) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Fecha actual en formato compatible con MySQL
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 19).replace('T', ' ');

    // Active_ como BIT(1) -> MySQL acepta 0 o 1
    const activeValue = ciaData.Active_ === '1' || ciaData.Active_ === 1 ? 1 : 0;

    // Primer INSERT (sin id_bu)
    const sqlInsert = `
      INSERT INTO me_cat_simplecatalogdetail (
        IdSimpleCatalog, Key_, SubKey, Name_, Description,
        IdCatDetailRelationShip, Active_, helperrelation,
        CreationUser, CreationDate, ModificationUser, ModificationDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valuesInsert = [
      ciaData.IdSimpleCatalog || 3,
      ciaData.Key_ || '1',
      ciaData.SubKey || '1',
      ciaData.Name_,
      ciaData.Description || ciaData.Name_,
      ciaData.IdCatDetailRelationShip || null,
      activeValue,
      ciaData.helperrelation || null,
      userId,
      formattedNow,
      null,
      null
    ];

    const [insertResult] = await connection.query(sqlInsert, valuesInsert);
    const insertedId = insertResult.insertId;

    // Actualizar id_bu con el mismo ID
    const sqlUpdate = `UPDATE me_cat_simplecatalogdetail SET id_bu = ? WHERE Id = ?`;
    await connection.query(sqlUpdate, [insertedId, insertedId]);

    await connection.commit();

    return {
      insertId: insertedId,
      compania: {
        id_cia: insertedId,
        nombreCia: ciaData.Name_,
        numeroEmpleados: 0,
        status: activeValue === 1 ? 'ACTIVO' : 'INACTIVO'
      },
      empleados: []
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};