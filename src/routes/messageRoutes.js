const express = require('express');
const { getMessages, getUserSidebarmessage, sendMessage, getUnreadCounts, markMessagesAsRead, deleteMessage, editMessage, sendGroupMessage, getGroupMessages } = require('../controllers/message');
const protectRoute = require('../middleware/userAuthenticate');
const upload = require('../../multer');

const router = express.Router();

router.get('/users', protectRoute, getUserSidebarmessage);
router.get('/unread-counts', protectRoute, getUnreadCounts);
router.post('/mark-read/:id', protectRoute, markMessagesAsRead);
router.get('/:id', protectRoute, getMessages);
router.post('/send/:id', protectRoute, upload.array('image'), sendMessage);
router.post('/send-group/:groupId', protectRoute, upload.array('image'), sendGroupMessage);
router.get('/group/:groupId', protectRoute, getGroupMessages);
router.patch('/:id', protectRoute, editMessage);
router.delete('/:id', protectRoute, deleteMessage);

module.exports = router;
