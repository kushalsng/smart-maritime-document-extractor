import express from "express";
import dotenv from "dotenv";

import { connectDB } from "./config/db";
import { testQuery } from "./util/db-helper";

dotenv.config();

const startServer = async () => {
  await connectDB();
  await testQuery();

  const app = express();
  app.use(express.json());


  app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
