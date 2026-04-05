import app from "./app.js";
import { pool } from "./db/pool.js";
import { ensureSchema } from "./db/ensureSchema.js";

const port = Number(process.env.PORT ?? 4000);

ensureSchema(pool)
  .then(() => {
    app.listen(port, () => {
      console.log(`GDPS API listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Database schema check failed:", err);
    process.exit(1);
  });
