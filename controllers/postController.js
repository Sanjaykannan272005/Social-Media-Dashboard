exports.getPosts = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
  
      const postsQuery = await pool.query(
        `SELECT p.*, u.username, u.avatar, 
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
         FROM posts p JOIN users u ON p.user_id = u.id
         ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
  
      const countQuery = await pool.query('SELECT COUNT(*) FROM posts');
      const totalPosts = parseInt(countQuery.rows[0].count);
      const totalPages = Math.ceil(totalPosts / limit);
  
      res.json({
        posts: postsQuery.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error' });
    }
  };

  const { pool } = require('../server');

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.*, u.username, u.avatar 
       FROM posts p JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const result = await pool.query(
      'INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING *',
      [req.user.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Add other controller methods as needed

const { pool } = require('../server');

// Add proper function definitions
const getPosts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Add other controller methods...

module.exports = {
  getPosts,
  createPost: async (req, res) => { /* implementation */ },
  toggleLike: async (req, res) => { /* implementation */ },
  getPost: async (req, res) => { /* implementation */ },
  deletePost: async (req, res) => { /* implementation */ }
};