-- schema.sql
-- Script de criação de tabelas e inserts de exemplo (MySQL)

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS ItemVenda;
DROP TABLE IF EXISTS Venda;
DROP TABLE IF EXISTS Produto;
DROP TABLE IF EXISTS Cliente;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Cliente (
  idCliente INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  senha CHAR(60) NOT NULL,
  obs TEXT,
  cpf CHAR(11),
  cnpj CHAR(14),
  nome VARCHAR(100),
  representante VARCHAR(100),
  email VARCHAR(150),
  telefone VARCHAR(15),
  nomeFantasia VARCHAR(100),
  rua VARCHAR(150),
  numero SMALLINT UNSIGNED,
  cep CHAR(8),
  uf CHAR(2),
  bairro VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Produto (
  idProduto INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(150),
  dataLote DATE,
  dataVal DATE,
  dataFab DATE,
  obs TEXT,
  foto VARCHAR(255), -- armazene caminho/URL; troque para LONGBLOB se quiser guardar binário
  valor DECIMAL(10,2),
  valorUnidade DECIMAL(10,2),
  ingredientes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Venda (
  idVenda INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  idCliente INT UNSIGNED,
  localEntrega VARCHAR(200),
  dataEntrega DATE,
  dataPedido DATE,
  valTotal DECIMAL(12,2),
  valUni DECIMAL(10,2),
  obs TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idCliente) REFERENCES Cliente(idCliente) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ItemVenda (
  idItem INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  idVenda INT UNSIGNED,
  idProduto INT UNSIGNED,
  qtd SMALLINT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idVenda) REFERENCES Venda(idVenda) ON DELETE CASCADE,
  FOREIGN KEY (idProduto) REFERENCES Produto(idProduto) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fim do script

-- Inserir usuário de teste (USERNAME: USERTESTE  |  SENHA: TESTE01)
-- Senha armazenada como hash bcrypt (não em texto simples); use 'TESTE01' para login
INSERT INTO users (username, password, role) VALUES ('USERTESTE', '$2a$10$Mp4EyJN33suKBUVNnupCluBvCPseBVgEBIJAv128KW.oWZbVVlq5u', 'user');
-- Inserir usuário de teste (USERNAME: USERTESTE  |  SENHA: TESTE01)
-- Senha já hashed com bcrypt (cost 10)

