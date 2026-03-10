import e from "express"
import { editprofile, getuserprofile, googleAuth, login, resetpassword, saveUserProfile, signup, verifycode } from "../Controllers/AuthController.js";
import { authval } from "../Middlewares/Auth.js";

const router = e.Router();

router.post('/register',signup)
router.post('/login',login)
router.post('/auth/google', googleAuth)
router.get('/user/profile',authval,getuserprofile)
router.post('/user/profile',authval,saveUserProfile)
router.put("/user/profile",authval,editprofile)
router.post("/user/reset-password",resetpassword)
router.post("/user/verify-reset-code",verifycode)
export default router