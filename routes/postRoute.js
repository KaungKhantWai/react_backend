const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');

router.route('/')
  .get(getPosts)
  .post(upload.single('image'), createPost);

router.route('/:id')
  .get(getPostById)
  .put(upload.single('image'), updatePost)
  .delete(deletePost);

module.exports = router;