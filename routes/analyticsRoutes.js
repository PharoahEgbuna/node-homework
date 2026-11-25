const express = require("express");
const analyticsController = require("../controllers/analyticsController")
const router = express.Router();

router.get("/:id", analyticsController.getUserAnalytics);
router.get("/", analyticsController.getUsersWithStats);
router.get("/tasks/search", analyticsController.searchTasks);

module.exports = router;