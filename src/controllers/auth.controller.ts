
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateTokens } from "../utils/generateTokens.js";
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { prisma } from "../config/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";


export const register = asyncHandler (async(req, res) => {
  const { name,email, password } = req.body;
    
     if (!name || !email || !password) {
      return new ApiError(404,"All fields are required")
     
     }
     //check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return new ApiError(400, "User already existed")
      }
      //Hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      //Create user
      const user = await prisma.user.create({
         data: { name , email, password: hashedPassword },
      });
      
      //Generate tokens
      const tokens = generateTokens(user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      const responseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      //Send JWT in http-only cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      })
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      })
      return res.status(200).json(
        new ApiResponse(200,{ user: responseUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },"User Created sucessfully")
    )
  
  
});

export const login = asyncHandler(async (req, res) => {

   const { email, password } = req.body;

  if (!email || !password) {
    return new ApiError(404,"All fields are required") 
  }


  const user = await prisma.user.findUnique({ where: { email } });

  if (!user){
     return new ApiError(401,"Invalid credentials")
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return new ApiError(401,"Invalid credentials")
    
  }

  const tokens = generateTokens(user.id);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
    select: {
      id: true,
      name: true,
      email: true
    },
  });

  //set cookie
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  res.cookie("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  //send response
  return res.status(201).json(
        new ApiResponse(201,{ user: updatedUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },"Login sucessfully")
    )

 
});

export const logoutUser = asyncHandler(async(req, res) => {

    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET!
        ) as { userId?: number };

        if (decoded?.userId) {
          await prisma.user.update({
            where: { id: decoded.userId },
            data: { refreshToken: null },
          });
        }
      } catch {
        // Ignore token parse errors during logout and continue cookie cleanup.
      }
    }

    //clear the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",   

    });
    res.clearCookie("accessToken", {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",   

    });
    return res.status(200).json(
      new ApiResponse(200,"Logged Out successful")
    )
    
 
});


export const refreshAccessToken = asyncHandler ( async (req, res) => {
  // jab ye call hoga toh hume kya krna hai ki,
  // sbse pehle refresh token lena hai, req se.
  // validate krna hai
  // then uske baad refresh token verify krna hai 
  // fir uske baad refresh token humko db m check krna hai
  // agar match ho jata hai toh uske baad hume access token generate krna hai,
  // response bhejna hai
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(404,"Refresh token is not provided")
  } 
  
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as Express.AuthJwtPayload;

    const userId = decodedToken.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new ApiError(401, "Token not found");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const tokens = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
        "Access token refreshed successfully"
      )
    );
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

