import pg from 'pg'

const { Pool } = pg
 
const pool = new Pool({
  user: 'neondb_owner',
  password: 'npg_n0AYiHyNGO5S',
  host: 'ep-gentle-field-a4u1ijwz-pooler.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
})