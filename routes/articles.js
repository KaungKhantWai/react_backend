const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/articleController');

router.route('/')
  .get(getArticles)
  .post(upload.single('photo'), createArticle);

router.route('/:id')
  .get(getArticleById)
  .put(upload.single('photo'), updateArticle)
  .delete(deleteArticle);

module.exports = router;