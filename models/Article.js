const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.ENUM('technology', 'lifestyle', 'education'),
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
    allowNull: false
  },
  photo: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  paragraph: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'articles'
});

module.exports = Article;