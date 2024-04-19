const { execSync } = require('child_process');
const { readFileSync } = require('fs');

function runCommand(command) {
  try {
    console.log(`Running command: ${command}`);
    const output = execSync(command, { stdio: 'pipe' });
    console.log(output.toString());
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout.toString());
    console.error(error.stderr.toString());
    process.exit(1);
  }
}

function checkFileContents(filePath, checks) {
  console.log(`Checking contents of: ${filePath}`);
  const content = readFileSync(filePath, { encoding: 'utf8' });

  Object.entries(checks).forEach(([key, shouldExist]) => {
    const exists = content.includes(key);
    if (exists !== shouldExist) {
      console.error(`Check failed: '${key}' should ${shouldExist ? 'exist' : 'not exist'} in ${filePath}`);
      process.exit(1);
    }
  });
}

function main() {
  // Compile clojure.cljs
  runCommand('npx squint compile clojure.cljs');

  // Bundle clojure.mjs into clojure.js
  runCommand('npx esbuild clojure.mjs --bundle --outdir=dist --platform=browser --tree-shaking=true');

  // Check clojure.js contents
  checkFileContents('./dist/clojure.js', {
    'export_not_in_main': true,
    'export_to_main': true,
    'private_shaken': false
  });

  // Bundle main.mjs into main.js
  runCommand('npx esbuild main.mjs --bundle --outdir=dist --platform=browser --tree-shaking=true');

  // Check main.js contents
  checkFileContents('./dist/main.js', {
    'export_to_main': true,
    'export_not_in_main': false,
    'private_shaken': false
  });

  console.log('Build completed successfully.');
}

main();

