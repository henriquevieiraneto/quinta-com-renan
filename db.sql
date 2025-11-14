-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS biblioteca_db;

-- Seleciona o Banco de Dados
USE biblioteca_db;

-- Criação da Tabela livros
CREATE TABLE IF NOT EXISTS livros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(100) NOT NULL,
    ano_publicacao INT NOT NULL,
    isbn VARCHAR(20),
    disponivel BOOLEAN NOT NULL DEFAULT TRUE
);