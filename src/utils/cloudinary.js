import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:  process.env.CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET
  });

  const uploadonCloudinary=async(localFilePath)=>{
    try{
        if(!localFilePath) throw new Error("Local file path is required");
        //upload file on cloudinary
        const result=await cloudinary.uploader.upload(localFilePath,
            { resource_type: "auto" })
            //file has been uploaded successfully
            console.log("file is uploaded on cloudinary: ",result.url);
            return result;
    }catch(error){
        fs.unlinkSync(localFilePath);//remove the loacal saved temporary file
        return null;

    }

  }

   
export default uploadonCloudinary;