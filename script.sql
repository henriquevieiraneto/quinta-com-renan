CREATE DATABASE IF NOT EXISTS users_db;

USE users_db;

CREATE TABLE IF NOT EXISTS users (

id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(100), email VARCHAR(100)

);

INSERT INTO users (nome, email) VALUES
('João da Silva', 'joao.silva@email.com'),
('Maria Oliveira', 'maria.oliveira@email.com'),
('Carlos Souza', 'carlos.souza@email.com'),
('Ana Paula', 'ana.paula@email.com'),
('Lucas Martins', 'lucas.martins@email.com'),
('Fernanda Lima', 'fernanda.lima@email.com'),
('Ricardo Alves', 'ricardo.alves@email.com'),
('Juliana Costa', 'juliana.costa@email.com'),
('Felipe Rocha', 'felipe.rocha@email.com'),
('Camila Mendes', 'camila.mendes@email.com');