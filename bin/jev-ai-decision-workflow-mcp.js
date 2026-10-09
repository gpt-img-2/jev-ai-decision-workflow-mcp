#!/usr/bin/env node

import("../dist/index.js").catch((error) => {
  console.error("Jev AI Decision Workflow MCP failed to start:", error);
  process.exit(1);
});
