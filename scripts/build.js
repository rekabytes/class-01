const { copyFile, mkdir, rm } = require("node:fs/promises");
const path = require("node:path");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const staticFiles = ["index.html", "styles.css"];

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY
  || process.env.SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || "";

async function build() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await Promise.all(
    staticFiles.map((file) => copyFile(path.join(root, file), path.join(output, file)))
  );
  await esbuild.build({
    entryPoints: [path.join(root, "app.js")],
    outfile: path.join(output, "app.js"),
    bundle: true,
    minify: true,
    platform: "browser",
    target: ["es2020"],
    define: {
      __SUPABASE_URL__: JSON.stringify(supabaseUrl),
      __SUPABASE_KEY__: JSON.stringify(supabaseKey)
    }
  });

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Built without Supabase credentials. The app will show setup instructions until environment variables are added.");
  }
  console.log("Built the static app in dist/");
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
