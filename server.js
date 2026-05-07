const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));



const Post = require('./models/Post');

const User = require('./models/Users');

const { sequelize, connectDB } = require('./config/database');

// Relationship ချိတ်ဆက်ခြင်း
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'authorDetail' });

// Database နှင့် ချိတ်ဆက်ပြီး Table ဆောက်ခြင်း
connectDB().then(() => {
  sequelize.sync({ alter: true }).then(() => {
    console.log('Database & Tables created!');
  });
});

// ၃. Multer Storage Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined in environment variables");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access Denied! No token provided." });
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            // Tell the client WHY it failed so it can react correctly
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Token expired. Please log in again." });
            }
            return res.status(403).json({ message: "Invalid token." });
        }

        // Guard against malformed payloads
        if (!decoded?.id || !decoded?.username) {
            return res.status(403).json({ message: "Invalid token payload." });
        }

        req.user = decoded;
        next();
    });
};

// ၄. POST Route (Form မှ Data သိမ်းရန်)
// authenticateToken ကို ကြားထဲမှာ ထည့်လိုက်တယ်
app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, category, paragraph, author } = req.body;
        
        const post = await Post.create({
            title,
            category,
            paragraph,
            author,
            user_id: req.user.id, 
            image: req.file ? req.file.filename : null
        });
        
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] } // Password ကို ဖျောက်ထားမယ်
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ၅. GET Route (သတင်းများ အားလုံး ပြန်ထုတ်ရန်)
app.get('/api/posts', async (req, res) => {
  try {
    const { search } = req.query;

    const where = search ? {
      [Op.or]: [
        { title: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { author: { [Op.like]: `%${search}%` } },
      ]
    } : {};

    const posts = await Post.findAll({
        where,
      include: [{
                model: User,
                as: 'authorDetail',
                attributes: ['username', 'email'] 
            }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: posts.length,
      data: posts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ၆. GET Route (Single Post - ID ဖြင့်ထုတ်ရန်)
app.get('/api/posts/:id', async (req, res) => {
    const post = await Post.findByPk(req.params.id);
    if (post) res.json(post);
    else res.status(404).send('Post not found');
});

app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // ၁. Email ရှိပြီးသားလား အရင်စစ်မယ်
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        if (password !== confirmPassword) {
  return res.status(400).json({ message: "Passwords do not match" });
}

        // ၂. Password ကို Hash လုပ်မယ် (လုံခြုံရေးအတွက်)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ၃. Database ထဲ သိမ်းမယ်
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // ၄. Password ကို ချန်ပြီး ကျန်တာကို Response ပြန်မယ်
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // ၁. Email နဲ့ User ရှိမရှိ အရင်ရှာမယ်
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // ၂. Password မှန်မမှန် bcrypt နဲ့ တိုက်စစ်မယ်
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password!" });
        }

        // ၃. Password မှန်ရင် JWT Token ထုတ်ပေးမယ်
        // process.env.JWT_SECRET ကို မင်းရဲ့ .env file ထဲမှာ သတ်မှတ်ထားပေးပါ
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token က ၁ ရက်ပဲ ခံမယ်
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/posts/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { title, category, paragraph, author } = req.body;

    await post.update({
      title,
      category,
      paragraph,
      author,
      image: req.file ? req.file.filename : post.image
    });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await post.destroy();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));