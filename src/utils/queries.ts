export const queries = {
  users: {
    getUserByEmail: "SELECT * FROM Usuario WHERE correo = $1",
    getUserById: "SELECT * FROM Usuario WHERE id_usuario = $1",
    getAllUsers:
      `SELECT u.id_user,
              u.name AS user_name,
              u.email,
              u.birthdate,
              u.phone_number,
              r.name AS role_name,
              COALESCE(uni.name, '') AS university_name
       FROM Users u
       JOIN Role r ON u.id_role = r.id
       LEFT JOIN University uni ON u.id_university = uni.id;`,
    insertUser:
      "INSERT INTO Users ( name, email, birthdate, password, phone_number, id_role, id_university ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    updateUser: `
        UPDATE Users 
        SET name = $2, email = $3, birthdate = $4, phone_number = $5, id_role = $6, id_university = $7
        WHERE id_user = $1 RETURNING id_user,name,email,birthdate,phone_number,id_role, id_university`,
    // Obsoleto: las fechas de periodo se mantienen en Schedule ahora
    deleteUser: "DELETE FROM Users WHERE id_user = $1",
  },
  cards: {
    getCards: "SELECT * FROM CARD",
    createCard: "INSERT INTO CARD(name,id_user) VALUES($1, $2) RETURNING *",
  },
};
