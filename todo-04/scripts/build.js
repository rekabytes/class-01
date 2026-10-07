const { copyFile, mkdir, rm } = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = ['index.html', 'styles.css', 'app.js'];

async function build() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await Promise.all(
    files.map((file) => copyFile(path.join(root, file), path.join(output, file)))
  );
  console.log(`Built ${files.length} static files in dist/`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
