import { Router } from "express";
import { protect,restrictTo } from "../controller/authController.js";
const resultRouter = Router();
import * as resultController from "../controllers/resultController.js"
resultRouter.route("/result")
.get(protect,restrictTo('teacher'),resultController.getAllResult)
.post( protect,restrictTo('teacher','admin'),resultController.postAllResult)

resultRouter.route('/:id')
  .get(resultController.getResultById)
  .patch( protect,restrictTo('teacher','admin'),resultController.upDateResult)
  .delete(protect,restrictTo('teacher','admin'),resultController.dropResullt);

resultRouter.route('/category/:category/subject/:subjectId')
  .get(resultController.getResultsBySubjectAndCategory);

resultRouter.route('/student/:studentId')
  .get(resultController.getAllResultsForStudent);

export default resultRouter

