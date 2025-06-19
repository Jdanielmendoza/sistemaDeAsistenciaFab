-- Habilitar la extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Roles
CREATE TABLE Role (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de Tarjetas RFID
CREATE TABLE Card (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
	id_user UUID UNIQUE,
	FOREIGN KEY (id_user) references Users(id_user) ON DELETE SET NULL
);

-- Tabla de Universidades (Opcional, solo si se requiere)
CREATE TABLE University (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE
);



-- Tabla de Usuarios
CREATE TABLE Users (
    id_user UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone_number VARCHAR(20),
    birthdate DATE,
    id_role UUID NOT NULL,
	id_university UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_role) REFERENCES Role(id) ON DELETE RESTRICT,
	FOREIGN KEY (id_university) REFERENCES University(id) ON DELETE SET NULL
);

-- Tabla de Horarios Asignados a Voluntarios
CREATE TABLE Schedule (
    id_schedule UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday, 7 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE
);

-- Tabla de Registro de Asistencia
CREATE TABLE AttendanceRecord (
    id_record UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- Puede ser NULL si aún no ha registrado su salida
    total_hours INTERVAL DEFAULT NULL, -- Se calcula en base a check-in/check-out
    overtime_hours INTERVAL DEFAULT NULL, -- Se calcula en base a los horarios
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Hora de creación
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Hora de actualización
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE
);

ALTER TABLE AttendanceRecord
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'America/La_Paz';
DROP TABLE AttendanceRecord
TRUNCATE TABLE attendanceRecord

ALTER TABLE Card 
ADD COLUMN id_user UUID UNIQUE;
ALTER TABLE Card
ADD CONSTRAINT fk_card_user
FOREIGN KEY (id_user)
REFERENCES Users(id_user) ON DELETE SET NULL;

SELECT Users.name, email, birthdate, phone_number, Role.name as Role_name, University.name as University_name
FROM Users,Role,University 
WHERE id_role = Role.id AND id_university = University.id

-- Insertar roles en la tabla Role
INSERT INTO Role (name) VALUES
    ('Voluntario'),
    ('Administrador');
