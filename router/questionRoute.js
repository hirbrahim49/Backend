// const express=require("express")
// const questionRouter=express.Router()
import { Router } from "express";
import { protect,restrictTo } from "../controller/authController.js";
import multer from "multer";
import { resizeQuestionImages,upload } from '../controller/questionController.js'
const questionRouter= Router()
// const {getAllquestions,getOneQuestion,deleteQuestion,postQuestion,updateQuestion}=require("../controller/questionController")
import *  as questionController from "../controller/questionController.js"

// questionRouter.route("/examination")
// .get(getAllquestions).post(postQuestion)
// questionRouter.route("/examination/:schoolid")
// .get(getOneQuestion).delete(deleteQuestion).patch(updateQuestion)

questionRouter.route("/examination")
.get(protect,restrictTo('admin'),questionController.getAllQuestions)
.post(questionController.createQuestion)

questionRouter.route("/examination/:schoolid")
.get(protect, restrictTo('teacher','admin'), questionController.getOneQuestion).
delete(protect, restrictTo('teacher','admin'),questionController.deleteQuestion)
.patch(protect, restrictTo('teacher','admin'),questionController.updateQuestion)

questionRouter.route("/examination/:schoolid/add-subject")
.patch(protect, restrictTo('teacher'),questionController.addSubjectToSchool);

questionRouter.route("/examination/:schoolid/add-topic")
.patch(protect, restrictTo('teacher'),questionController.addTopicToSubject);

questionRouter.route("/examination/:schoolid/add-question")
  .patch(
    protect, 
    restrictTo('teacher', 'admin'), 
    upload.single('value'), // This comes from the controller file, where it is defined correctly
    resizeQuestionImages, // Middleware to handle image resizing
    questionController.addQuestionToTopic
  );




export default questionRouter;