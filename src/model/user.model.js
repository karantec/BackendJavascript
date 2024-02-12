import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const UserSchema=new Schema({

     username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
     },
     email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
     },
     fullName:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
     },
     avatar:{
        type:String, // cloudinary url
        required:true,
        
     },
     coverImage:{
        type:String,// cloudinary url
     },
     watchHistory:{
        type:Schema.Types.ObjectId,
        ref:"Video"
     },
     password:{
        type:String,
        required:[true,"Password is required"],
     },
     refreshToken:{
        type:String,
     },
    },
   
    {
        timestamps:true,
    
    })
    //hashing password before saving
    UserSchema.pre("save",async function(next){
        if(!this.isModified("password")) return next();
        this.password=await bcrypt.hash(this.password,10);
        next();
    })
    //compare password
    UserSchema.methods.isPasswordCorrect=async function(password){
        return  await bcrypt.compare(password,this.password);
    }
    UserSchema.methods.generateToken=function(){
        return jwt.sign({   
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        })
        
    }
    UserSchema.methods.generateRefreshToken=function(){
        return jwt.sign({   
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRE,
        {
            expiresIn:process.env.REFRESH_TOKEN_SECRET_EXPIRY
        })
        
    
    }

export const User=mongoose.model("User",UserSchema);