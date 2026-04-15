import express from "express";
import extractRoutes from "./routes/routes";

import { connectDB } from "./config/db";
import { testQuery } from "./util/db-helper";
import { startQueue } from "./queue/startQueue";
import { registerExtractWorker } from "./queue/extract.worker";


const startServer = async () => {
  await connectDB();
  await testQuery();

  await startQueue();
  await registerExtractWorker();

  const app = express();
  app.use(express.json());

  app.use("/api", extractRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
