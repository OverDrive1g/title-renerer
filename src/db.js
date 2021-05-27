const sqlite3 = require("sqlite3");
const { open, Database } = require("sqlite");

const { generatePassword } = require("./utils");

const createGroup = `CREATE TABLE IF NOT EXISTS "group" (
	"id" INTEGER NOT NULL,
	"name" VARCHAR(50) NOT NULL,
	PRIMARY KEY ("id")
);`;

const createRole = `CREATE TABLE IF NOT EXISTS "roles" (
	"id" INTEGER NOT NULL,
	"name" INTEGER NOT NULL,
	PRIMARY KEY ("id")
);`;

const initRoles = `REPLACE INTO "roles" ("id", "name") VALUES
(1, 'Руководитель'),
(2, 'Студент');`;

const createUser = `CREATE TABLE IF NOT EXISTS "users" (
	"id" INTEGER NOT NULL,
	"login" VARCHAR(50) NOT NULL UNIQUE,
	"password" VARCHAR(50) NOT NULL,
	"first_name" VARCHAR(50) NULL,
	"second_name" VARCHAR(50) NULL,
	"third_name" VARCHAR(50) NULL,
	"role" INTEGER NULL,
	"group" INTEGER NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "0" FOREIGN KEY ("group") REFERENCES "group" ("id") ON UPDATE SET NULL ON DELETE SET NULL,
	CONSTRAINT "1" FOREIGN KEY ("role") REFERENCES "roles" ("id") ON UPDATE SET NULL ON DELETE SET NULL
);`;

const initUsers = `REPLACE INTO "users" ("id", "login", "password", "first_name", "second_name", "third_name", "role", "group") VALUES
(1, 'admin', 'admin', 'Админ','Админ','Админ', 1, NULL);`;

const createTitle = `CREATE TABLE IF NOT EXISTS "titles" (
	"id" INTEGER NOT NULL,
	"template" TEXT NOT NULL,
	"path" VARCHAR(100),
	"user_id" INTEGER NOT NULL,
	PRIMARY KEY ("id")
);`;

class Db {
  _db;
  constructor() {}

  async init() {
    console.log("Инициализация БД");
    this._db = await open({
      filename: "./tmp/database.db",
      driver: sqlite3.Database,
    });

    await this._db.exec(createGroup);
    await this._db.exec(createRole);
    await this._db.exec(initRoles);
    await this._db.exec(createUser);
    await this._db.exec(initUsers);
    await this._db.exec(createTitle);

    console.log("БД успешно инициализированна");
  }

  /**
   * Метод для создания студента
   * @param {String} first_name
   * @param {String} second_name
   * @param {String} third_name
   * @param {Number} group_id
   * @param {String} stud_num
   */
  async addStudent(first_name, second_name, third_name, group_id, stud_num) {
    const password = generatePassword();
    const params = [
      stud_num,
      password,
      first_name,
      second_name,
      third_name,
      group_id,
    ];

    const stmt = await this._db.prepare(
      `INSERT INTO "users" ("login", "password", "first_name", "second_name", "third_name", "role", "group") VALUES (?, ?, ?, ?, ?, 2, ?);`,
      params
    );
    await stmt.run();

    return password;
  }
  async addTeacher(first_name, second_name, third_name, login) {
    const password = generatePassword();
    const params = [login, password, first_name, second_name, third_name];
    const stmt = await this._db.prepare(
      `INSERT INTO "users" ("login", "password", "first_name", "second_name", "third_name", "role", "group") VALUES (?, ?, ?, ?, ?, 1, NULL);`,
      params
    );
    await stmt.run();
    return password;
  }

  async getUser(login) {
    return await this._db.all(`select * from "users" where login = ?`, [login]);
  }
  async getUserById(id) {
    return (
      (await this._db.all(`select * from "users" where id = ?`, [id]))[0] ||
      null
    );
  }
  async deleteUser() {}

  async addGroup() {}
  async getGroup() {
    return this._db.all('select * from "group"');
  }
  async getGroupById(id) {
    return (
      (await this._db.all(`select * from "group" where id = ?`, [id]))[0] ||
      null
    );
  }
  async deleteGroup() {}

  async createTemplate(template, user_id) {
    const params = [template, user_id];
    const stmt = await this._db.prepare(
      `INSERT INTO "titles" ("template", "user_id") VALUES (?, ?);`,
      params
    );
    const res = await stmt.run();
    return res.lastID;
  }

  async addPathToTemplate(id, path) {
    const params = [path, id];
    const stmt = await this._db.prepare(
      `UPDATE "titles" SET "path" = ? WHERE id = ?`,
      params
    );
    const res = await stmt.run();
    console.log(res);
    return res.lastID;
  }

  async getTemplate(id) {
    return (
      (await this._db.all(`select * from "titles" where id = ?`, [id]))[0] ||
      null
    );
  }
  async deleteTemplate() {}
}

module.exports = Db;
