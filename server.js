const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ၁. MySQL Connection Setup
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: 3306
});

// ၂. Post Model သတ်မှတ်ခြင်း (Table Structure)
const Post = sequelize.define('Post', {
    title: { type: DataTypes.STRING, allowNull: false },
    tag: { type: DataTypes.STRING },
    author: { type: DataTypes.STRING, allowNull: false },
    image_path: { type: DataTypes.STRING },
    paragraph: { type: DataTypes.TEXT, allowNull: false }
});

// Database နှင့် ချိတ်ဆက်ပြီး Table ဆောက်ခြင်း
sequelize.sync().then(() => console.log('Database & Tables created!'));

// ၃. Multer Storage Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ၄. POST Route (Form မှ Data သိမ်းရန်)
app.post('/api/posts', upload.single('image'), async (req, res) => {
    try {
        const { title, tag, author, paragraph } = req.body;
        const post = await Post.create({
            title,
            tag,
            author,
            paragraph,
            image_path: req.file ? req.file.path : null
        });
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ၅. GET Route (သတင်းများ အားလုံး ပြန်ထုတ်ရန်)
app.get('/api/posts', async (req, res) => {
    const posts = await Post.findAll({ order: [['createdAt', 'DESC']] });
    res.json(posts);
});

// ၆. GET Route (Single Post - ID ဖြင့်ထုတ်ရန်)
app.get('/api/posts/:id', async (req, res) => {
    const post = await Post.findByPk(req.params.id);
    if (post) res.json(post);
    else res.status(404).send('Post not found');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));