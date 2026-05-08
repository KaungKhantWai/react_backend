const express = require('express');
const {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser
} = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
