import { pool } from '../utils/db.js';
import dotenv from 'dotenv';
dotenv.config();

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

    //obtiene el id insertado para usarlo como id_bu
    const insertedId = insertResult.insertId;

    console.log(`Nueva compañía insertada con Id: ${insertedId}`);

    // Actualizar id_bu con el mismo ID insertado
    const sqlUpdate = `UPDATE me_cat_simplecatalogdetail SET id_bu = ? WHERE Id = ?`;
    await connection.query(sqlUpdate, [insertedId, insertedId]);
        
    /**
     * INSERT DE CATÁLOGOS
     * Clona catálogos base y les asigna el id_bu creado
     * Valida que CATALOG_TEMPLATE_BU esté definido en .env
     */
    const ID_BU_BASE = Number(process.env.CATALOG_ID_BU_BASE);
    console.log('CATALOG_ID_BU_BASE:', process.env.CATALOG_ID_BU_BASE);
    console.log('ID_BU_BASE (Number):', ID_BU_BASE);

    if (!ID_BU_BASE) {
      throw new Error('CATALOG_ID_BU_BASE no está definido en el .env');
    }

    /**
     * Inserta catálogos base para la nueva compañía y evita duplicados si ya existen
     */
    const sqlCloneCatalogs = `
      INSERT INTO me_cat_simplecatalogdetail
      (
        IdSimpleCatalog,
        Key_,
        SubKey,
        Name_,
        Description,
        IdCatDetailRelationShip,
        Active_,
        helperrelation,
        CreationUser,
        CreationDate,
        ModificationUser,
        ModificationDate,
        id_bu
      )
      SELECT
        c.IdSimpleCatalog,
        c.Key_,
        c.SubKey,
        c.Name_,
        c.Description,
        c.IdCatDetailRelationShip,
        c.Active_,
        c.helperrelation,
        ?,
        NOW(),
        NULL,
        NULL,
        ?
      FROM me_cat_simplecatalogdetail c
      WHERE c.id_bu = ?
        AND c.IdSimpleCatalog IN (13, 11, 10, 30, 31)
        AND NOT EXISTS (
          SELECT 1
          FROM me_cat_simplecatalogdetail x
          WHERE x.id_bu = ?
            AND x.IdSimpleCatalog = c.IdSimpleCatalog
            AND x.Key_ = c.Key_
        )
    `;

    await connection.query(sqlCloneCatalogs, [
      userId,        // CreationUser
      insertedId,    // id_bu NUEVO (compañía creada)
      ID_BU_BASE, // id_bu base (83777)
      insertedId    // id_bu NUEVO (para el NOT EXISTS)
    ]);

    console.log(`Catálogos base clonados para id_bu ${insertedId}`);
      
    /**
    * COMMIT 
    */
    await connection.commit();

    //retornar datos de la nueva compañía
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