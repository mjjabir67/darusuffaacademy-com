import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { preview } from "vite";

async function main() {
  console.log("==> Building project with Vite (NODE_ENV=production)...");
  process.env.NODE_ENV = "production";

  // Clean prior dist if present
  const distDir = path.resolve(process.cwd(), "dist");
  const outDir = path.resolve(process.cwd(), ".output/public");

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // Run Vite build
  execSync("npx vite build", {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });

  console.log("==> Capturing production static index.html and static routes...");
  const ssrDir = path.resolve(process.cwd(), "node_modules/.nitro/vite/services/ssr");
  const distServerDir = path.resolve(distDir, "server");
  fs.mkdirSync(distServerDir, { recursive: true });
  fs.cpSync(ssrDir, distServerDir, { recursive: true });
  fs.copyFileSync(path.join(distServerDir, "index.js"), path.join(distServerDir, "server.js"));

  const server = await preview({
    preview: {
      port: 3998,
      host: "127.0.0.1",
    },
  });

  const routesToPrerender = [
    "/",
    "/about",
    "/admission",
    "/academic",
    "/art-literature",
    "/contact",
    "/gallery",
    "/media",
    "/news",
    "/magazine",
    "/language-door",
    "/ssf-dawa",
    "/staff",
    "/admin-login",
    "/student-login",
  ];

  try {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    let rootHtml = "";

    for (const route of routesToPrerender) {
      try {
        const res = await fetch(`http://127.0.0.1:3998${route}`);
        if (!res.ok) {
          console.warn(`Warning: failed to fetch ${route} (status ${res.status})`);
          continue;
        }
        const html = await res.text();

        if (route === "/") {
          rootHtml = html;
          const publicIndexPath = path.join(outDir, "index.html");
          fs.writeFileSync(publicIndexPath, html, "utf-8");
          // Also write 404.html as SPA fallback for Firebase Hosting
          const public404Path = path.join(outDir, "404.html");
          fs.writeFileSync(public404Path, html, "utf-8");
          console.log(
            `==> Generated static index.html & 404.html in ${outDir} (${html.length} bytes)`,
          );
        } else {
          const targetDir = path.join(outDir, route.replace(/^\//, ""));
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetDir, "index.html"), html, "utf-8");
          console.log(`==> Generated static route ${route} -> ${targetDir}/index.html`);
        }
      } catch (err) {
        console.warn(`Could not prerender route ${route}:`, err.message);
      }
    }

    if (!rootHtml) {
      throw new Error("Failed to capture root index.html during prerendering.");
    }
  } finally {
    await server.close();
  }

  // Mirror .output/public into dist so both dist and .output/public work with Firebase CLI
  console.log("==> Populating dist directory for Firebase Hosting...");
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.cpSync(outDir, distDir, { recursive: true });

  console.log("==> Ensuring firebase.json and .firebaserc exist...");
  const firebaseJsonPath = path.resolve(process.cwd(), "firebase.json");
  const firebasercPath = path.resolve(process.cwd(), ".firebaserc");

  const firebaseJsonContent = JSON.stringify(
    {
      hosting: {
        public: "dist",
        ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
      },
    },
    null,
    2,
  );

  const firebasercContent = JSON.stringify(
    {
      projects: {
        default: "darussuffaacademyonline",
      },
    },
    null,
    2,
  );

  if (!fs.existsSync(firebaseJsonPath)) {
    fs.writeFileSync(firebaseJsonPath, firebaseJsonContent + "\n", "utf-8");
  }
  if (!fs.existsSync(firebasercPath)) {
    fs.writeFileSync(firebasercPath, firebasercContent + "\n", "utf-8");
  }

  console.log("==> Build & Static packaging completed successfully!");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
