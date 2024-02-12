import {Router} from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
//file upload middleware
import {upload} from "../middleware/multer.middleware.js";
const router=Router();


router.route("/register").post(
    upload.fields([
        {name:"avatar",maxCount:1},
        {
            name:"coverImage",maxCount:1
        }
    ]),
    registerUser);

router.route("/login").post(loginUser)    
//secure routes
// router.route("/logout").post(verifyJWT,logoutUser);
export default router;