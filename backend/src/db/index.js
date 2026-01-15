import sql from "mssql";
import { dbConfig } from "./config.js";

let pool;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}
