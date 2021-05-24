const spawn = require("child_process").spawn;
const uuid = require("uuid").v4;
const express = require("express");
const fs = require("fs/promises");

const app = express();

const makePdf = async (dir) => {
  fs.mkdir("");
  return new Promise((resolve, reject) => {
    const process = spawn(
      "pdflatex",
      ["-output-directory", "build", "./main.tex"],
      { stdio: "pipe", detached: true }
    );
    process.on("exit", () => {
      resolve();
    });
    process.on("error", () => {
      reject();
    });
  });
};

app.get("/", async function (req, res) {
  const uuid = uuid();
  await makePdf();
  res.setHeader("content-type", "application/pdf");
  res.send(await fs.readFile("./build/main.pdf"));
});

app.listen(3000);
