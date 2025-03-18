export const queries = {
  users: {
    getUserByEmail: "SELECT * FROM Usuario WHERE correo = $1",
    getUserById: "SELECT * FROM Usuario WHERE id_usuario = $1",
    getAllUsers: "SELECT Users.id_user, Users.name as user_name, email, birthdate, phone_number, Role.name as Role_name, University.name as university_name FROM Users,Role,University WHERE id_role = Role.id AND id_university = University.id",
    insertUser: "INSERT INTO Users ( name, email, birthdate, password, phone_number, id_role, id_university ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    updateUser: `
        UPDATE Users 
        SET name = $2, email = $3, birthdate = $4, phone_number = $5, id_role = $6, id_university = $7
        WHERE id_user = $1 RETURNING id_user,name,email,birthdate,phone_number,id_role, id_university`,
    deleteUser: "DELETE FROM Users WHERE id_user = $1",
  },
  cards: {
    getCards: "SELECT * FROM TARJETA",
    createCard:
      "INSERT INTO tarjeta(id_tarjeta,codigo_rfid) VALUES($1, $2) RETURNING *",
  },
};
