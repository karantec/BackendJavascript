const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err));    

    }

}
export {asyncHandler};

// const asyncHandler=()=>()=>{}
// const asyncHandler=(fn)=>()=>{
//   try{
//    await fn(req,res,next)=>{
//   }catch(error){
//     res.status(error.code || 500).json({
//         success:false,
//         message:error.message || "Internal server error"
//     })
//   }

// }