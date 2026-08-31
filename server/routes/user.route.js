import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getCurrentUser } from "../controller/user.controller.js";


const userRouter = express.Router();

 userRouter.get("/current-user",isAuth,getCurrentUser)



export default userRouter;