import express from "express";
import {
  saveRegistration,
  getRegistrations,
  getRegistrationDetails
} from "../controllers/registrationController.js";

const router = express.Router();

// Public
router.post("/register", saveRegistration);

// Admin
router.get("/registrations", getRegistrations);
router.get("/registration", getRegistrationDetails);

export default router;
