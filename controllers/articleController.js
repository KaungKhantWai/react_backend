const Article = require('../models/Article');

const getArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, count: articles.length, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getArticleById = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    res.json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createArticle = async (req, res) => {
  try {
    const { category, title, author, datetime, paragraph } = req.body;
    
    const article = await Article.create({
      category,
      title,
      author,
      datetime,
      paragraph,
      photo: req.file ? req.file.filename : null
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.photo = req.file.filename;
    }

    await article.update(updateData);
    res.json({ success: true, data: article });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    await article.destroy();
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
};