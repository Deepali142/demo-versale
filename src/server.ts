import app from "./app";
import { startCron } from "./config/cron";
const PORT = parseInt(process.env.PORT || "3000", 10);

startCron();

app.listen(PORT, () =>
  console.log(`server running on http://localhost:${PORT}`),
);
