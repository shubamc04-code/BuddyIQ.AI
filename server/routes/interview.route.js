import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { uploade } from "../middlewares/multer.js";
import { analyzeResume, finishInterview, generateQuestion, getInterviewReport,  getMyInterviews, submitAnswer } from "../controller/interview.controller.js";



const interviewRouter = express.Router();

 interviewRouter.post("/resume",isAuth,uploade.single('resume'),
analyzeResume) //front end se ak file bhejenge jiska nam hoga resume

interviewRouter.post("/generate-questions",isAuth,generateQuestion)
interviewRouter.post("/submit-answer",isAuth,submitAnswer)
interviewRouter.post("/finish",isAuth,finishInterview)

interviewRouter.get("/get-interview",isAuth,getMyInterviews)
interviewRouter.get("/report/:id",isAuth,getInterviewReport)


export default interviewRouter;