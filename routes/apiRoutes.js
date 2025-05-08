const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get all public posts
router.get('/posts', async (req, res) => {
    const result = await pool.query(`
        SELECT p.*, u.username, 
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_public = true OR p.user_id = $1
        ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    // Get comments for each post
    const posts = await Promise.all(result.rows.map(async post => {
        const comments = await pool.query(`
            SELECT c.*, u.username 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
        `, [post.id]);
        return { ...post, comments: comments.rows };
    }));
    
    res.json(posts);
});

// Create post
router.post('/posts', async (req, res) => {
    const { content, is_public } = req.body;
    await pool.query(
        'INSERT INTO posts (user_id, content, is_public) VALUES ($1, $2, $3)',
        [req.user.id, content, is_public === 'on']
    );
    res.status(201).send();
});

// Like/unlike post
router.post('/posts/:id/like', async (req, res) => {
    await pool.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
        [req.user.id, req.params.id]
    );
    res.status(204).send();
});

router.delete('/posts/:id/like', async (req, res) => {
    await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [req.user.id, req.params.id]
    );
    res.status(204).send();
});

// Add comment
router.post('/posts/:id/comments', async (req, res) => {
    const { content } = req.body;
    await pool.query(
        'INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3)',
        [req.user.id, req.params.id, content]
    );
    res.status(201).send();
});

// Follow user
router.post('/users/:id/follow', async (req, res) => {
    await pool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [req.user.id, req.params.id]
    );
    res.status(204).send();
});

// Get messages
router.get('/messages', async (req, res) => {
    const messages = await pool.query(`
        SELECT m.*, u.username as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.receiver_id = $1
        ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json(messages.rows);
});

module.exports = router;