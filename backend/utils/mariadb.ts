import mariadb from 'mariadb'

let pool: mariadb.Pool | null = null

export default async () => {
  if (!pool) {
    pool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      connectionLimit: 10,
    })
  }
  return pool
}