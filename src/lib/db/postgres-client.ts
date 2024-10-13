const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_FOR_BUCK_YOU,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
