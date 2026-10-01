create database gymflash;
use gymflash;

/** Tabla de Usuarios**/
create table user(
    id int not null auto_increment primary key,
    name varchar(255),
    lastname varchar(255),
    email varchar(255),
    password varchar(255),
    address varchar(255),
    phone varchar(255),
    image varchar(255),
    kind int default 0,/* 0. normal, 1. administrator*/
    status int default 1,/* 0. inactive, 1. active */
    created_at datetime    
);
insert into user (name,lastname, email,password,created_at) value ("Administrator","","admin",sha1(md5("admin")),NOW());


create table person(
	id int not null auto_increment primary key,
	name varchar(50),
	lastname varchar(50),
	email varchar(255),
	address varchar(255),
	phone varchar(255),
	image varchar(255),
	created_at datetime
);


/** Tabla de clientes **/
create table client(
    id int not null auto_increment primary key,
    name varchar(255),
    lastname varchar(255),
    email varchar(255),
    password varchar(255),
    address varchar(255),
    phone varchar(255),
    image varchar(255),
    created_at datetime    
);

/** Tabla de tipos de Membresias **/
create table membership(
    id int not null auto_increment primary key,
    name varchar(255),
    description varchar(255),
    duration varchar(255), /* duration in days */
    price double not null,
    created_at datetime
);

/** Tabla de Compra de membresias del cliente **/
create table contract(
    id int not null auto_increment primary key,
    client_id int not null, /* cliente que contrata la membresia */
    membership_id int not null, /* tipo de membresia  que contrata */
    user_id int not null, /* usuario que crear el contrato */
    start_at date not null, /** Fecha de inicio **/
    finish_at date not null, /** Fecha de fin **/
    status int default 1, /** 0. bloqueado, 1. activo **/
    created_at datetime,
    foreign key (client_id) references client(id),
    foreign key (membership_id) references membership(id),
    foreign key (user_id) references user(id)
);

create table payment (
    id int not null auto_increment primary key,
    client_id int not null, /* cliente que realiza el pago */
    contract_id int not null, /* id del contrato */
    user_id int not null, /* usuario recibe el pago */
    amount double,
    created_at datetime,
    foreign key (client_id) references client(id),
    foreign key (contract_id) references contract(id),
    foreign key (user_id) references user(id)
);

create table control(
    id int not null auto_increment primary key,
    client_id int not null, /* cliente que realiza el pago */
    contract_id int not null, /* id del contrato */
    user_id int not null, /* usuario recibe el pago */
    description varchar(255), /* comentario de access */
    created_at datetime,
    foreign key (client_id) references client(id),
    foreign key (contract_id) references contract(id),
    foreign key (user_id) references user(id)
);