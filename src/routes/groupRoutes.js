const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group');
const userAuthenticate = require('../middleware/userAuthenticate');

router.post('/create', userAuthenticate, ...groupController.createGroup);
router.get('/', userAuthenticate, groupController.getGroups);

module.exports = router; 