CREATE DATABASE IF NOT EXISTS CRUD
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE CRUD;

CREATE TABLE IF NOT EXISTS Administrador (
    idAdministrador INT NOT NULL AUTO_INCREMENT,
    nomeUsuario VARCHAR(50) NOT NULL,
    senhaHash VARCHAR(255) NOT NULL,
    PRIMARY KEY (idAdministrador),
    UNIQUE KEY uq_administrador_nomeUsuario (nomeUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Cliente (
    idCliente INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(11) NULL,
    cnpj VARCHAR(14) NULL,
    representante VARCHAR(150) NULL,
    email VARCHAR(150) NULL,
    telefone VARCHAR(20) NULL,
    nomeFantasia VARCHAR(150) NULL,
    observacao TEXT NULL,
    rua VARCHAR(150) NULL,
    numero INT NULL,
    cep CHAR(8) NULL,
    uf CHAR(2) NULL,
    bairro VARCHAR(100) NULL,
    PRIMARY KEY (idCliente),
    UNIQUE KEY uq_cliente_cpf (cpf),
    UNIQUE KEY uq_cliente_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Produto (
    idProduto INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    observacao TEXT NULL,
    valor DECIMAL(10,2) NULL,
    ingredientes TEXT NULL,
    PRIMARY KEY (idProduto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Venda (
    idVenda INT NOT NULL AUTO_INCREMENT,
    idCliente INT NOT NULL,
    localEntrega VARCHAR(255) NULL,
    dataPedido DATE NOT NULL,
    dataEntrega DATE NULL,
    valorTotal DECIMAL(10,2) NULL,
    observacao TEXT NULL,
    PRIMARY KEY (idVenda),
    CONSTRAINT fk_venda_cliente
        FOREIGN KEY (idCliente) REFERENCES Cliente (idCliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ItemVenda (
    idItemVenda INT NOT NULL AUTO_INCREMENT,
    idVenda INT NOT NULL,
    idProduto INT NOT NULL,
    quantidade INT NOT NULL,
    valorUnitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (idItemVenda),
    CONSTRAINT fk_itemVenda_venda
        FOREIGN KEY (idVenda) REFERENCES Venda (idVenda),
    CONSTRAINT fk_itemVenda_produto
        FOREIGN KEY (idProduto) REFERENCES Produto (idProduto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;