import { Pool } from 'pg';

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});
const dev_pool = new Pool({
  user: process.env.DB_USER_DEV,
  host: process.env.DB_HOST_DEV,
  database: process.env.DB_NAME_DEV,
  password: process.env.DB_PASSWORD_DEV,
  port: Number(process.env.DB_PORT_DEV) || 5432,
  
});


export const query = async (text: string, params?: any[]) => {
  const client = await dev_pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Error en la consulta:', error);
    throw error;
  } finally {
    client.release();
  }
};
