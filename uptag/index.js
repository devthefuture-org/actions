const fs = require("fs/promises");
const yaml = require("yaml");
const set = require("lodash.set");

const yamlLoadAll = (input) => {
  const documents = [];

  const append = (arr) => {
    const doc = arr.join("\n").trim();
    if (doc.length > 0) {
      const obj = yaml.parse(doc.toString());
      if (obj !== null) {
        documents.push(obj);
      }
    }
  };

  let currentDoc = [];
  for (const line of input.split("\n")) {
    if (line.startsWith("---")) {
      append(currentDoc);
      currentDoc = [];
    } else {
      currentDoc.push(line);
    }
  }
  append(currentDoc);

  return documents;
};

const main = async () => {
  const defaultTag = process.env.TAG;
  const cdApp = process.env.CD_APP;
  const cdEnv = process.env.CD_ENV;
  const cdKey = process.env.CD_KEY;
  const workingDir = process.env.CD_WORKING_DIR;
  process.cwd(workingDir);
  let apps;
  if (cdApp.includes("\n")) {
    apps = yamlLoadAll(cdApp);
  } else {
    apps = cdApp.split(",").map((name) => ({ name }));
  }
  const envs = cdEnv.split(",");
  for (const app of apps) {
    for (const env of envs) {
      const { name, key = cdKey, tag = defaultTag } = app;
      const valuesFile = `apps/${name}/envs/${env}/values.yaml`;
      console.log(`${valuesFile} -> ${key}=${tag}`);
      const valuesRaw = await fs.readFile(valuesFile, { encoding: "utf-8" })
      const values = yaml.parse(valuesRaw);
      set(values, key, tag);
      await fs.writeFile(yaml.stringify(values), { encoding: "utf-8" });
    }
  }
};

main();
