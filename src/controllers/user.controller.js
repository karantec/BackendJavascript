import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from "../model/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessAndRefreshToken();
         const refreshToken= user.generateRefreshToken();
        
         user.refreshToken=refreshToken
         await user.save({validateBeforeSave:false});

         return {accessToken,refreshToken};


    }catch(error){
        throw new ApiError(500,"Something went wrong while refreshing token")

    }
}
const registerUser=asyncHandler(async(req,res,next)=>{
    
    // get user details from request body
    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
//    if(!coverImage){
//     throw new ApiError(400,"cover file is required")
//    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )
  
   
    
const loginUser=asyncHandler(async(req,res,next)=>{
    // req body se data lene hia
    const {email,username,password}=req.body;
    // username or email
    if(!username || !email){
        throw new ApiError(400, "username or password id required");
    }
    //find the user
   const user= User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,
            "User doest not exist");
    }
    // password check
    const isPasswordValid=await User.isPasswordCorrect(password)
        if(!isPasswordValid){
            throw new ApiError(401,
                "invalide user credential");
        }
    
    // acces and refresh token
        const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
    //send cookies
    const loggedInuser=await User.findById(user._id)
    select("-password  -refreshToken" )

    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(200,
            {
                user:loggedInuser,accessToken,refreshToken
            },
            "User logged in Successfully"
            )
    )

})

const logoutUser=asyncHandler(async(req,res,next)=>{
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true,
            runValidators:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200,{},"User logged out successfully")
    )


})

const refreshAccessToken=asyncHandler(async(req,res,next)=>{
   try {
     const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
     if(!incomingRefreshToken){
         throw new ApiError(401,"unauthorized request")
     }
     const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
     const user= await User.findById(decodedToken._id)
     if(!user){
         throw new ApiError(401,"Invalide refresh token")
     }
     if(incomingRefreshToken!==user?.refreshToken){
         throw new ApiError(401,"Refresh Token is invalid")
     }
     const options={
         httpOnly:true,
         secure:true,
     }
     const {accessToken,newrefreshtoken}= await generateAccessAndRefreshToken(user._id)
     return res
     .status(200).cookie("accessToken",accessToken,options)
     .cookie("refresh Token",newrefreshtoken,options)
     .json(
         new ApiResponse(200,
             
             {accessToken,newrefreshtoken},
             "Access Token refreshed"
             )
     )
 
             
 
   } catch (error) {
     throw new ApiError(401, error?.message || "invalid refresh token")
   }
})

const changeCurrentPassword=asyncHandler(async(req,res,next)=>{
    const {oldPassword,newPassword,confPassword}=req.body
    const user= await User.findById(req.user?._id)
   const isPasswordCorrect= user.isPasswordCorrect(oldPassword)
   
   if(!(newPassword === confPassword)){

   }
   if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old Password");
   }
   user.password=newPassword
   await user.save({validateBeforeSave:false})
   return res.status(200).json(
    new  ApiResponse(200,{},"Password Changed Successfully"))




})
const getCurrentUser=asyncHandler(async(req,res,next)=>{
    return res 
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccount=asyncHandler(async(req,res,next)=>{
  try {
      const {fullName,email, }=req.body;
      if(!fullName || !email){
          throw new ApiError(400,"All fields are required");
      }
     const user=User.findByIdAndUpdate(req.user?._id,
      {
          $set:{
              fullName:fullName,
              email:email
  
          }
      },
      {new:true}
      ).select("-password")
      return res.status(200)
      .json(new ApiError(200,user,"Account Details updated successfully"))
  
  
  } catch (error) {
    throw new ApiError(500,"Account details not updated successfully");
    
  }
})
const updateUserAvator=asyncHandler(async(req,res,next)=>{
  try {
    const avatorLocalPath = await  req.file?.path
    if(!avatorLocalPath){
      throw new ApiError(400,"Avator file is missing")
    }
    const avator= uploadOnCloudinary(avatorLocalPath)
    if(!avator.url){
      throw new ApiError(400,"Error while uploading on avator")
    }
    await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
          avator:avator.url
      }
    },
    {new: true}
  ).select("-password")
  
  } catch (error) {
    throw new ApiError(404,"Updated cover not updated")
    
  }
})
const updateUserCoverImage=asyncHandler(async(req,res,next)=>{
   try {
     const CoverLocalPath = await  req.file?.path
     if(!CoverLocalPath){
       throw new ApiError(400,"Avator file is missing")
     }
     const coverImage= uploadOnCloudinary(CoverLocalPath)
     if(!coverImage.url){
       throw new ApiError(400,"Error while Cover")
     }
    const user=await User.findByIdAndUpdate(req.user?._id,
     {
       $set:{
           coverImage:coverImage.url
       }
     },
     {new: true}
   ).select("-password")
   return res.status(200).json(
     new ApiResponse(200, user,"Cover image updated successfully")
   )
   
   } catch (error) {
     throw new ApiResponse(404,
        "Cover image not updated successfully")
   }
  })
export {registerUser,loginUser,logoutUser,refreshAccessToken ,changeCurrentPassword,getCurrentUser,updateAccount,updateUserAvator,
    updateUserCoverImage};