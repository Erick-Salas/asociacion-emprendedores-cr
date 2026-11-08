CREATE DATABASE asociacion_db CHARACTER SET utf8mb4;
USE asociacion_db;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol ENUM('empleado','administrador','emprendedor') NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'adminuser24';
GRANT SELECT, INSERT, UPDATE ON asociacion_db.usuarios TO 'app_user'@'localhost';