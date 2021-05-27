const fs = require("fs/promises");
const uuid = require("uuid").v4;
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const renderPdf = require("./render");
const Db = require("./db");

const db = new Db();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function validateAuth(header) {
  try {
    const [login, password] = Buffer.from(header.split(" ")[1], "base64")
      .toString("utf8")
      .split(":");
    const users = await db.getUser(login);
    if (users.length == 0) {
      return null;
    }
    if (users[0].password === password) {
      return users[0];
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

const main = async () => {
  await db.init();

  app.get("/", async function (req, res) {});

  app.get("/render", async (req, res) => {
    // const id = uuid();
    // await renderPdf(id, title);
    if (!req.query.id) {
      res.status(404);
      res.send();
      return;
    }

    const found_template = await db.getTemplate(req.query.id);
    if (!found_template || !found_template.path) {
      res.status(404);
      res.send();
      return;
    }

    res.setHeader("content-type", "application/pdf");
    res.send(await fs.readFile(found_template.path));
  });

  app.post("/register/student", async (req, res) => {
    const user = await validateAuth(req.headers.authorization);
    if (!user || user.role !== 1) {
      res.status(403);
      res.end();
      return;
    }
    const {
      first_name,
      second_name,
      third_name,
      group_id,
      stud_num,
    } = req.body;

    const users = await db.getUser(stud_num);

    if (users.length > 0) {
      res.status(500);
      res.send({ error: `Студент с логином=${stud_num} уже создан` });
      return;
    }

    try {
      const password = await db.addStudent(
        first_name,
        second_name,
        third_name,
        group_id,
        stud_num
      );
      res.status(200);
      res.send({ login: stud_num, password });
    } catch (e) {
      console.log(`Ошибка пи создании студента`);
      res.status(500);
      res.send({ error: e.message });
    }
  });
  app.post("/register/teacher", async (req, res) => {
    const user = await validateAuth(req.headers.authorization);
    if (!user || user.role !== 1) {
      res.status(403);
      res.end();
      return;
    }
    const { first_name, second_name, third_name, login } = req.body;

    const users = await db.getUser(login);

    if (users.length > 0) {
      res.status(500);
      res.send({ error: `Преподаватель с логином=${login} уже создан` });
      return;
    }

    try {
      const password = await db.addTeacher(
        first_name,
        second_name,
        third_name,
        login
      );
      res.status(200);
      res.send({ login, password });
    } catch (e) {
      console.log(`Ошибка пи создании преподавателя`);
      res.status(500);
      res.send({ error: e.message });
    }
  });
  app.post("/login", async (req, res) => {
    const user = await validateAuth(req.headers.authorization);

    res.status(200);
    res.send({ ok: !!user });
  });

  app.get("/template", (req, res) => {});
  app.post("/template", async (req, res) => {
    const user = await validateAuth(req.headers.authorization);
    if (!user || user.role !== 1) {
      res.status(403);
      res.end();
      return;
    }

    let { template, student_id } = req.body;

    const maybe_user = await db.getUserById(student_id);
    if (!maybe_user || !maybe_user.group) {
      res.status(500);
      res.send({ error: "Студент не найден или не принадлежит группе" });
      return;
    }

    const maybe_group = await db.getGroupById(maybe_user.group);
    if (!maybe_group) {
      res.status(500);
      res.send({ error: "Группа не найдена" });
      return;
    }

    let new_template = template
      .replace(/\$\{group\}/gi, maybe_group.name)
      .replace(
        /\$\{student\}/gi,
        `${maybe_user.second_name} ${maybe_user.first_name} ${maybe_user.third_name}`
      );
    console.log(new_template);

    const id = await db.createTemplate(new_template, student_id);

    const template_id = uuid();
    await renderPdf(template_id, new_template);

    await db.addPathToTemplate(
      id,
      path.join("/tmp", "render", template_id, "build", "main.pdf")
    );

    res.send({ ok: true, id });
  });
  app.put("/template", (req, res) => {});
  app.delete("/template", (req, res) => {});

  app.listen(3000, () => {
    console.log("Сервер запущен!");
  });
};

main();
