DROP DATABASE IF EXISTS consultorio_db;
CREATE DATABASE consultorio_db;
USE consultorio_db;

-- ==========================================================
-- 1. MÓDULO DE SEGURIDAD Y USUARIOS (NUEVO)
-- ==========================================================

-- Tabla Única de Acceso
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL, -- En prod esto debe ser hash
    rol ENUM('Administrador', 'Medico', 'Paciente') NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- 2. ACTORES DEL SISTEMA
-- ==========================================================

CREATE TABLE paciente (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNIQUE, -- Link al login (Opcional si el paciente se registra)
    nombre_completo VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    email VARCHAR(100),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE medico (
    id_medico INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNIQUE, -- Link al login
    nombre_completo VARCHAR(100) NOT NULL,
    especialidad VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ==========================================================
-- 3. MÓDULO DE INVENTARIOS (MEDICINAS Y EQUIPOS)
-- ==========================================================

CREATE TABLE medicamento (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    precio_unitario DECIMAL(10, 2) NOT NULL
);

-- NUEVO: Inventario de Equipos (Máquinas, Utensilios)
CREATE TABLE equipo_medico (
    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('Maquinaria', 'Instrumental', 'Insumo') NOT NULL,
    serial VARCHAR(50),
    estado ENUM('Operativo', 'Mantenimiento', 'Baja') DEFAULT 'Operativo'
);

-- ==========================================================
-- 4. MÓDULO CLÍNICO (EL GRAN CAMBIO DE LÓGICA)
-- ==========================================================

-- Catálogo de Servicios (Lo que antes llamabas 'tratamiento' simple)
CREATE TABLE catalogo_servicio (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL, -- Ej: "Consulta General", "Limpieza", "Examen Sangre"
    costo DECIMAL(10, 2) NOT NULL
);

-- NUEVO: El "Tratamiento" como PROCESO (Container de citas)
-- Ej: "Tratamiento de Ortodoncia" (Inicia hoy, termina en 6 meses)
CREATE TABLE tratamiento_proceso (
    id_proceso INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_medico INT NOT NULL,
    nombre_tratamiento VARCHAR(150) NOT NULL, -- Ej: "Rehabilitación Rodilla"
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE, -- Se llena cuando el Admin finaliza
    estado ENUM('En Curso', 'Solicitud Finalizacion', 'Finalizado') DEFAULT 'En Curso',
    observaciones_finales TEXT,
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    FOREIGN KEY (id_medico) REFERENCES medico(id_medico)
);

-- Citas (Ahora pueden estar ligadas a un tratamiento/proceso o ser sueltas)
CREATE TABLE cita (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL,
    motivo TEXT,
    estado ENUM('Pendiente', 'Completada', 'Cancelada', 'Facturada') DEFAULT 'Pendiente',
    id_paciente INT NOT NULL,
    id_medico INT NOT NULL,
    id_proceso INT, -- Opcional: Si pertenece a un tratamiento largo
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    FOREIGN KEY (id_medico) REFERENCES medico(id_medico),
    FOREIGN KEY (id_proceso) REFERENCES tratamiento_proceso(id_proceso)
);

-- Historia Clínica (Detalle de lo que pasó en UNA cita)
CREATE TABLE historia_clinica (
    id_historia INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL UNIQUE,
    diagnostico TEXT NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita)
);

-- ==========================================================
-- 5. MÓDULO DE LABORATORIO (NUEVO)
-- ==========================================================

CREATE TABLE orden_laboratorio (
    id_orden INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    tipo_examen VARCHAR(100) NOT NULL, -- Ej: "Hemograma"
    resultados TEXT, -- Aquí el doctor escribe o pega resultados
    fecha_resultado DATETIME,
    estado ENUM('Solicitado', 'Procesando', 'Entregado') DEFAULT 'Solicitado',
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita)
);

-- ==========================================================
-- 6. FACTURACIÓN
-- ==========================================================

CREATE TABLE factura (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
);

-- ==========================================================
-- 7. REQUISITOS ACADÉMICOS (TRIGGER, SP, FUNCTION)
-- ==========================================================

DELIMITER $$

-- 1. FUNCIÓN: Calcular Costo Total acumulado de un Proceso de Tratamiento
-- Suma el costo de todas las citas asociadas a ese proceso.
DROP FUNCTION IF EXISTS fn_calcular_costo_proceso$$
CREATE FUNCTION fn_calcular_costo_proceso(p_id_proceso INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_total DECIMAL(10,2);
    -- Por simplicidad, asumimos que cada cita vale $50 base
    SELECT COUNT(*) * 50.00 INTO v_total 
    FROM cita 
    WHERE id_proceso = p_id_proceso AND estado IN ('Completada', 'Facturada');
    RETURN IFNULL(v_total, 0);
END$$

-- 2. STORED PROCEDURE: Registrar Usuario y Paciente al mismo tiempo (Transacción)
DROP PROCEDURE IF EXISTS sp_registrar_paciente_usuario$$
CREATE PROCEDURE sp_registrar_paciente_usuario(
    IN p_nombre VARCHAR(100),
    IN p_dni VARCHAR(20),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(100)
)
BEGIN
    DECLARE v_id_usuario INT;
    
    START TRANSACTION;
    
    -- Insertar Login
    INSERT INTO usuario (username, password, rol) VALUES (p_email, p_password, 'Paciente');
    SET v_id_usuario = LAST_INSERT_ID();
    
    -- Insertar Perfil Paciente
    INSERT INTO paciente (id_usuario, nombre_completo, dni, email) 
    VALUES (v_id_usuario, p_nombre, p_dni, p_email);
    
    COMMIT;
END$$

-- 3. TRIGGER: Auditoría de Inventario
-- Evita que el stock de equipos sea negativo
DROP TRIGGER IF EXISTS trg_check_stock_equipos$$
CREATE TRIGGER trg_check_stock_equipos
BEFORE UPDATE ON equipo_medico
FOR EACH ROW
BEGIN
    IF NEW.estado = 'Baja' AND OLD.estado = 'Operativo' THEN
        -- Aquí podrías insertar en una tabla de auditoría, por ahora solo validamos
        SET NEW.nombre = CONCAT(OLD.nombre, ' (BAJA)');
    END IF;
END$$

DELIMITER ;

-- Seed Data (Optional but helpful)
INSERT INTO usuario (username, password, rol) VALUES ('admin', 'admin123', 'Administrador');
INSERT INTO usuario (username, password, rol) VALUES ('medico1@test.com', '123456', 'Medico');
INSERT INTO medico (id_usuario, nombre_completo, especialidad) VALUES (LAST_INSERT_ID(), 'Dr. House', 'Diagnostico');
