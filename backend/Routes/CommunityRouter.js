import express from 'express';
import { getPosts, createPost, votePost, addComment, voteComment, getCommunityStats } from '../Controllers/CommunityController.js';
import { authval } from '../Middlewares/Auth.js';

const router = express.Router();

router.get('/stats', getCommunityStats);
router.get('/posts', getPosts);
router.post('/posts', authval, createPost);
router.put('/posts/:id/vote', authval, votePost);
router.post('/posts/:id/comments', authval, addComment);
router.put('/posts/:id/comments/:commentId/vote', authval, voteComment);

export default router;
