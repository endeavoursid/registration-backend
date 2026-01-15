import express from "express";
import cors from "cors";
import registrationRoutes from "./routes/registrationRoutes.js";

const app = express();

app.use(cors({
  origin: "*",   // tighten later
  methods: ["GET", "POST"]
}));

app.use(express.json());

app.use("/api", registrationRoutes);

export default app;
