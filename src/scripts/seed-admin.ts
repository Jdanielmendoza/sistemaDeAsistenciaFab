import { query } from "@/utils/db";
import bcrypt from "bcryptjs";

(async () => {
  try {
    const username = "adminVoluntarios";
    const email = "admin@fablab.local";
    const plainPassword = "123456";

    // ¿Ya existe?
    const exists = await query("SELECT 1 FROM Users WHERE name = $1 LIMIT 1", [username]);
    if (exists.rowCount && exists.rowCount > 0) {
      console.log("El usuario administrador ya existe. Nada que hacer.");
      process.exit(0);
    }

    // Obtener id del rol Administrador
    const roleRes = await query("SELECT id FROM Role WHERE name = 'Administrador' LIMIT 1");
    if (roleRes.rowCount === 0) {
      console.error("No existe el rol 'Administrador'. Crea los roles primero.");
      process.exit(1);
    }
    const roleId = roleRes.rows[0].id;

    const hashed = await bcrypt.hash(plainPassword, 10);

    await query(
      `INSERT INTO Users (name, email, password, id_role, phone_number, birthdate)
       VALUES ($1, $2, $3, $4, '000000000', '1990-01-01')`,
      [username, email, hashed, roleId]
    );

    console.log("Usuario administrador creado con éxito →", email, plainPassword);
    process.exit(0);
  } catch (err) {
    console.error("Error creando admin:", err);
    process.exit(1);
  }
})(); 