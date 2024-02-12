import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from "../model/use.model.js";
import {uploadonCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
// /import { upload } from '../middleware/multer.middleware.js';
const registerUser=asyncHandler(async(req,res,next)=>{
    
    // get user details from request body
    const {fullName,email,username,password}=req.body
    // console.log(fullName);
    // console.log(email);
    //validation -not empty
   //standard validation
    if(
        [fullName,email,username,password].some((field)=>
            field?.trim()==="")
        ) {
            
            throw new ApiError(400,"All fields are required");
        }
//check if user already exists , email
       const existingUser= User.findOne({
            $or : [{username},{email}]

        })
        
        if(existingUser){
            throw new ApiError(409,"User with email or username already exists")
        }

          //check for images ,check for avator
    //upload them to cloudinary,avator and coverImage
       const avatorlocalPath=req.files?.avatar[0]?.path;
       const coverlocalPath=req.files?.coverImage[0];
       if(!avatorlocalPath){
        throw new ApiError(400,"avator file is required");
       }
       const avator = await uploadonCloudinary(avatorLocalPath);
       const coverImage=await uploadonCloudinary(coverlocalPath);
       if(!avator){
        throw new ApiError(400,"Avator not found");
       }

         //create user object- create entry in db
       const user=awaitUser.create({
        fullName,
        avator:avatar.url,
        coverImage:coverImage?.url|| " ",
        email,
        username:username.toLowerCase(),


       })
       //remove password and refresh token fied from response
       const created=await User.findById(user._id).select("-password -refreshToken");
       if(!created){
        throw new ApiError(500,"something not wrong");
       }
          //check for user creation 
          return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        )
    
    } )

        
  

  
   
    
  
    //return response






export {registerUser};