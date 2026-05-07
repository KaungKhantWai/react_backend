const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  datetime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW 
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  paragraph: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  user_id: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'id' } }
},
{
  timestamps: true,
  tableName: 'posts'
});

module.exports = Post;