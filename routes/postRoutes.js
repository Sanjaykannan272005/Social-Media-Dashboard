const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

module.exports = () => {
  // Verify controller methods exist
  if (!postController.getPosts || typeof postController.getPosts !== 'function') {
    throw new Error('postController.getPosts is not a function');
  }

  router.get('/', postController.getPosts);
  router.post('/', ensureAuthenticated, postController.createPost);
  router.post('/:id/like', ensureAuthenticated, postController.toggleLike);
  router.get('/:id', postController.getPost);
  router.delete('/:id', ensureAuthenticated, postController.deletePost);

  return router;
};

// In your route files, add validation:
if (!postController.getPosts || typeof postController.getPosts !== 'function') {
    throw new Error('postController.getPosts is not a function');
  }