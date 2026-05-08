const bcrypt = require('bcrypt');
const { Op, fn, col } = require('sequelize');
const Post = require('../models/Post');
const User = require('../models/Users');

const allowedRoles = ['admin', 'user'];

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role
});

const findExistingUser = async (username, email) => {
  return User.findOne({
    where: {
      [Op.or]: [{ username }, { email }]
    }
  });
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Post,
          as: 'posts',
          attributes: []
        }
      ],
      attributes: {
        include: [
          [fn('COUNT', col('posts.id')), 'postCount']
        ]
      },
      group: ['User.id'],
      subQuery: false,
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or user' });
    }

    const existingUser = await findExistingUser(username, email);
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} is already registered` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: publicUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or user' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    return res.json({
      message: 'User role updated successfully',
      user: publicUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Post.update({ user_id: null }, { where: { user_id: user.id } });
    await user.destroy();
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser
};
