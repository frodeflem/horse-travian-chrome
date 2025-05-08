// build.mjs  (Node 18+)
import esbuild from "esbuild";
import glob from "fast-glob";
import chokidar from "chokidar"; // ➊  npm i -D chokidar
import { cp, rm } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const watchMode = process.argv.includes("--watch");

// 0. Clean dist/ on full rebuilds
if (!watchMode) await rm("dist", { recursive: true, force: true });

// 1. Bundle every *.ts in src/
const entryPoints = await glob("src/**/*.ts");
const opts = {
	entryPoints,
	outdir: "dist",
	bundle: true,
	format: "esm",
	target: "es2022",
	sourcemap: "inline",
	entryNames: "[name]",
	outbase: "src",
};

if (watchMode) {
	const ctx = await esbuild.context(opts);
	await ctx.watch();
	console.log("👀  esbuild watching src/ ...");
} else {
	await esbuild.build(opts);
	console.log("✅  bundles built");
}

// 2. Initial static copy
await cp("static", "dist", { recursive: true, force: true });
console.log("📦  static files copied");

// 3. Watch static/ and recopy on change  ➋
if (watchMode) {
	chokidar.watch("static", { ignoreInitial: true }).on("all", async (_event, path) => {
		// Compute the relative path <static/...>
		const rel = path.replace(/^static[\\/]/, "");
		const dest = join(dirname(fileURLToPath(import.meta.url)), "dist", rel);

		await cp(path, dest, { recursive: false, force: true });
		console.log(`🔄  static updated -> ${rel}`);
	});

	console.log("👀  watching static/ ...");
}
