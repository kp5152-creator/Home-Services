const port = process.argv[2] || process.env.PORT || "3030";
const baseUrl = `http://127.0.0.1:${port}`;
const targets = ["/api/health", "/demo"];

async function checkTarget(pathname) {
  const url = `${baseUrl}${pathname}`;

  try {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    return { pathname, ok: response.ok, status: response.status };
  } catch (error) {
    return {
      pathname,
      ok: false,
      error: error instanceof Error ? error.message : "Request failed"
    };
  }
}

const results = await Promise.all(targets.map(checkTarget));
const ready = results.some((result) => result.ok);

for (const result of results) {
  if (result.ok) {
    console.log(`OK ${baseUrl}${result.pathname} returned ${result.status}`);
  } else {
    console.log(`NO ${baseUrl}${result.pathname} ${result.error || `returned ${result.status}`}`);
  }
}

if (ready) {
  console.log(`Open ${baseUrl}/demo`);
} else {
  console.log(`Start with: npm run dev -- -H 127.0.0.1 -p ${port}`);
  process.exitCode = 1;
}
