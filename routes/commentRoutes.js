const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

module.exports = () => {
  router.get('/:postId', commentController.getComments);
  router.post('/', ensureAuthenticated, commentController.createComment);
  router.delete('/:id', ensureAuthenticated, commentController.deleteComment);

  return router;
};

// In your route files, add validation:
if (!postController.getPosts || typeof postController.getPosts !== 'function') {
    throw new Error('postController.getPosts is not a function');
  }