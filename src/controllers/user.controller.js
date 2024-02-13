import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from "../model/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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




export {registerUser,loginUser,logoutUser};