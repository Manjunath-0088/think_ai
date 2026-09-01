const express = require("express");

const router = express.Router();

const studioController = require("../controllers/studioController");

router.get("/sessions/:id", studioController.getSession);
router.post("/sessions/:id/join", studioController.joinSession);
router.post("/sessions/:id/polls", studioController.createPoll);
router.post("/polls/:pollId/vote", studioController.votePoll);

module.exports = router;
