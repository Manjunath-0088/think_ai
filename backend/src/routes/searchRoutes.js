const express = require('express');
const { search } = require('../controllers/mobileSearchController');

const router = express.Router();
router.get('/', search);

module.exports = router;
