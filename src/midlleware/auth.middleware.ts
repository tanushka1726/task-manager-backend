
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const authMiddleware = asyncHandler(async(req, res, next)=> {

     const authHeaderToken = req.headers.authorization?.split(" ")[1];
     const cookieToken = req.cookies?.refreshToken;
     const token = authHeaderToken ?? cookieToken;
     if (!token) {
      return res.status(401).json(new ApiResponse(401,null,"Unauthorized request"))
   
     } 
    const secret = authHeaderToken ? process.env.JWT_SECRET! : process.env.JWT_REFRESH_SECRET!;
    const decoded = jwt.verify(token, secret);
    req.user = decoded as Express.AuthJwtPayload;
    next();
 

 
});

export default authMiddleware;