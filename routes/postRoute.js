const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');

router.route('/')
  .get(getPosts)
  .post(authenticateToken, upload.single('image'), createPost);

router.route('/:id')
  .get(getPostById)
  .put(authenticateToken, upload.single('image'), updatePost)
  .delete(authenticateToken, deletePost);

module.exports = router;
