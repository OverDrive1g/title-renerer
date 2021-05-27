const spawn = require("child_process").spawn;
const path = require("path");
const uuid = require("uuid").v4;
const fs = require("fs/promises");

async function prepareWorkDir(dir_name, template) {
  const dir_path = path.join("/tmp", "render", dir_name);
  console.log(`Создание рабочей директории ${dir_path}`);
  try {
    await fs.mkdir(dir_path, { recursive: true });
    await fs.mkdir(path.join(dir_path, "build"), { recursive: true });
    await fs.writeFile(path.join(dir_path, "title.tex"), template);
    await fs.copyFile("./res/main.tex", path.join(dir_path, "main.tex"));
  } catch (error) {
    console.error(
      `Ошибка при создании директории ${dir_name}\n${error.message}`
    );
  }
  console.log(`Рабочая директории ${dir_path} успешно создана!`);
}

async function renderPdf(dir_name, template) {
  await prepareWorkDir(dir_name, template);

  return new Promise((resolve, reject) => {
    console.log(`Генерация PDF для директории ${dir_name}`);
    const process = spawn(
      "pdflatex",
      ["-output-directory", "build", "./main.tex"],
      {
        stdio: "pipe",
        detached: true,
        cwd: path.join("/tmp", "render", dir_name),
      }
    );
    process.on("exit", () => {
      console.log(`PDF успешно сгенерирован ${dir_name}`);
      resolve();
    });
    process.on("error", (err) => {
      console.log(`Ошибка генерации PDF ${dir_name}\n${err.message}`);
      reject();
    });
  });
}

module.exports = renderPdf;
