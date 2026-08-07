import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  {
    encoding: "utf8",
  },
)
  .split("\0")
  .filter(Boolean);
const errors = [];

for (const file of trackedFiles) {
  if (/^\.env(?!\.example$)/.test(file)) {
    errors.push(`${file}: environment file must not be tracked`);
  }

  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  if (
    /VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|SERVICE_ROLE|DATABASE_URL)/.test(content)
  ) {
    errors.push(`${file}: a private value is exposed through a VITE_ variable`);
  }
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) {
    errors.push(`${file}: contains a private key`);
  }
  if (
    /(?:gh[oprsu]_[A-Za-z0-9]{30,}|sk_(?:live|test)_[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_-]{20,})/.test(
      content,
    )
  ) {
    errors.push(`${file}: contains a credential-shaped token`);
  }
}

const example = readFileSync(".env.example", "utf8");
const viteConfig = readFileSync("vite.config.ts", "utf8");

if (/supabase-api-cache|runtimeCaching[\s\S]*supabase\.co/.test(viteConfig)) {
  errors.push(
    "vite.config.ts: authenticated Supabase API responses must not be cached",
  );
}

const exampleKeys = [...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(
  (match) => match[1],
);
const expectedKeys = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
if (
  exampleKeys.length !== expectedKeys.length ||
  expectedKeys.some((key) => !exampleKeys.includes(key))
) {
  errors.push(
    ".env.example: expected only the public Supabase URL and publishable key",
  );
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Security check passed (${trackedFiles.length} project files scanned).`,
);
