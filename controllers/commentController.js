exports.createComment = async (req, res) => {
    try {
      const { postId, content } = req.body;
      const userId = req.user.id;
  
      const result = await pool.query(
        `INSERT INTO comments (user_id, post_id, content)
         VALUES ($1, $2, $3) RETURNING *,
         (SELECT username FROM users WHERE id = $1) as username`,
        [userId, postId, content]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error' });
    }
  };
  
  exports.getComments = async (req, res) => {
    try {
      const { postId } = req.params;
      
      const result = await pool.query(
        `SELECT c.*, u.username, u.avatar
         FROM comments c JOIN users u ON c.user_id = u.id
         WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
        [postId]
      );
      
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error' });
    }
  };