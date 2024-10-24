import * as authController from "../controller/authController.js";
import { getAllUser, getMe, getUser,uploadUserPhoto,resizeUserPhoto } from "../controller/userController.js";
import { Router } from "express";
import multer from "multer";



const userRouter = Router();

userRouter.post('/forgotpassword', authController.forgetPassword);
userRouter.patch('/resetpassword/:token', authController.resetPassword);
userRouter.patch('/updatePassword', authController.protect, authController.updatePassword);
userRouter.patch('/updateMe', authController.protect,resizeUserPhoto, uploadUserPhoto,authController.updateMe);  // Make sure updateMe is defined
userRouter.delete('/deleteMe', authController.protect, authController.deleteMe);

userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
userRouter.route('/logout').post(authController.logout);


userRouter.route("/").get(authController.protect,authController.restrictTo('teacher'),getAllUser);
userRouter.get('/me', getMe, getUser);

export default userRouter;
