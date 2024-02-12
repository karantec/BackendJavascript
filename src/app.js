import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app=express();



app.use(express.json({limit: "30mb", extended: true}));
app.use(express.urlencoded({limit: "30mb", extended: true}));

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.static("public"));
app.use(cookieParser());
//routes
import userRouter from "./routes/user.router.js";
//routes declaration
app.use("/api/v1/users",userRouter);



export default app;