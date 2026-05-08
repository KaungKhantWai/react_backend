const { Op } = require('sequelize');
const Post = require('../models/Post');
const User = require('../models/Users');

const canManagePost = (post, user) => {
  return Number(post.user_id) === Number(user.id) || user.role === 'admin';
};

const getPosts = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { category: { [Op.like]: `%${search}%` } },
            { author: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const posts = await Post.findAll({
      where,
      include: [{
        model: User,
        as: 'authorDetail',
        attributes: ['username', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'authorDetail',
        attributes: ['username', 'email']
      }]
    });

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    return res.json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { category, title, author, datetime, paragraph } = req.body;
    const post = await Post.create({
      category,
      title,
      author: author || req.user.username,
      datetime,
      paragraph,
      user_id: req.user.id,
      image: req.file ? req.file.filename : null
    });

    return res.status(201).json({ success: true, data: post });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (!canManagePost(post, req.user)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { category, title, author, datetime, paragraph } = req.body;
    const updateData = {
      category,
      title,
      author,
      datetime,
      paragraph
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (req.file) {
      updateData.image = req.file.filename;
    }

    await post.update(updateData);
    return res.json({ success: true, data: post });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (!canManagePost(post, req.user)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await post.destroy();
    return res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
