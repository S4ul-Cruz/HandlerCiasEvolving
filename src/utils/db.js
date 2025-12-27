import mysql from 'mysql2/promise';

// Configuración de conexión (Idealmente usa variables de entorno en producción)
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin2025',
    database: process.env.DB_NAME || 'erh_me',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Creamos el pool de conexiones (Singleton)
export const pool = mysql.createPool(dbConfig);
