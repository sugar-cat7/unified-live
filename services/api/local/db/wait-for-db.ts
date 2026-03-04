import { getCurrentTimestamp } from "@my-app/dayjs";
import mysql from "mysql2/promise";

const DATABASE_URL =
  process.env.DATABASE_URL || "mysql://root@127.0.0.1:4000/test";
const TIMEOUT = 60000; // 60 seconds

const waitForMySqlConnection = async (): Promise<boolean> => {
  const start = getCurrentTimestamp();
  console.log("Waiting for MySQL connection...");

  while (getCurrentTimestamp() - start < TIMEOUT) {
    try {
      const conn = await mysql.createConnection(DATABASE_URL);
      await conn.query("SELECT 1");
      await conn.end();
      console.log("MySQL is ready!");
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return false;
};

waitForMySqlConnection().then((ready) => {
  process.exit(ready ? 0 : 1);
});
