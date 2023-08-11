#!/usr/bin/env node

const fs = require("fs");
const { version } = JSON.parse(fs.readFileSync("package.json"));
const generatePackageJson = (dirName) => {
  fs.mkdirSync(dirName, { recursive: true });
  fs.writeFileSync(
    `${dirName}/package.json`,
    JSON.stringify({ 
      type: "module",
      types: `../dist-ts/${dirName}.d.ts`,
      main: `../dist-cjs/${dirName}.js`,
      module: `../dist-esm/${dirName}.js`,
     })
  );
}

generatePackageJson("string");
generatePackageJson("maybe-file");
