const express = require("express");
const analyticsController = require("../controllers/analyticsController")
const router = express.Router();

router.get("/", analyticsController.getUsersWithStats);
router.post("/tasks/search", analyticsController.searchTasks);
router.get("/:id", analyticsController.getUserAnalytics);