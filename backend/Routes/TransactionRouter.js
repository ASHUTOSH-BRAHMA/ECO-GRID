import express from "express";
import { getUserTransactions, createTransaction } from "../Controllers/TransactionController.js";
import { authval } from "../Middlewares/Auth.js";

const router = express.Router();

router.get('/user/transactions', authval, getUserTransactions);
router.post('/transactions', authval, createTransaction);

export default router;
