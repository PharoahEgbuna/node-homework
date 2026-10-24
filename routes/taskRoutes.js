const express = require("express");
const userController = require("../controllers/userController")
const router = express.Router();

router.get("/", userController.index);
router.get("/:id", userController.show);
router.post("/", userController.create);
router.patch("/:id", userController.update);
router.delete("/:id", userController.deleteTask);

module.exports = router;