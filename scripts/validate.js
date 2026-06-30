const { loadedConfig, validateSite } = require("../server");

const result = validateSite();

console.log(`simple-www validation`);
console.log(`Config: ${loadedConfig.source}`);
console.log(`Version: ${result.version}`);

if (result.warnings.length) {
  console.log(`Warnings: ${result.warnings.length}`);
  result.warnings.forEach((warning) => {
    console.log(`- ${warning.type}: ${warning.module}/${warning.slug}`);
  });
}

if (!result.ok) {
  console.error(`Errors: ${result.errors.length}`);
  result.errors.forEach((error) => {
    console.error(`- ${error}`);
  });
  process.exit(1);
}

console.log("OK");
