import { Router } from "express";
import authMiddleware from "../midlleware/auth.middleware.js";
import { register, login ,logoutUser, refreshAccessToken} from "../controllers/auth.controller.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshAccessToken)
router.get("/check-login",authMiddleware,(req,res)=>{
     res.status(200).json({message:"User is authenticated",user:req.user})
})


export default router;
