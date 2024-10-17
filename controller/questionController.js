import fs from "fs";
import Exam from "../model/questionModel.js";
import multer from "multer";
import sharp from "sharp";

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

export const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Middleware to handle image resizing
export const resizeQuestionImages = async (req, res, next) => {
  if (!req.file) return next();  // Only run if there's a file

  const imageFilename = `questions-${req.params.topicName}-${Date.now()}-image.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/questions/${imageFilename}`);

  // Add the image URL to req.body.value
  req.body.value = `/img/questions/${imageFilename}`;

  next();
};
export const getAllQuestions = async (req, res) => {
  try {
    const allExams = await Exam.find();
    res.status(200).json({
      status: "success",
      message: "All questions fetched successfully",
      numResults: allExams.length,
      data: {
        allExams
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error fetching questions',
      error: error.message
    });
  }
};

export const getOneQuestion = async (req, res) => {
  try {
    const oneExam = await Exam.findById(req.params.schoolid);
    res.status(200).json({
      status: "success",
      message: "A question retrieved successfully",
      data: {
        oneExam
      }
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};


export const createQuestion = async (req, res) => {
  try {
    const createExam = await Exam.create(req.body);
    res.status(201).json({
      status: "success",
      message: "Question successfully created",
      data: {
        createExam
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error creating the question',
      error: error.message
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const deletedExam = await Exam.findByIdAndDelete(req.params.schoolid);
    if (!deletedExam) {
      return res.status(404).json({
        status: "fail",
        message: "No question found with that ID"
      });
    }
    res.status(200).json({
      status: "success",
      message: "Question successfully deleted"
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error deleting the question',
      error: error.message
    });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const updateExam = await Exam.findByIdAndUpdate(req.params.schoolid, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updateExam) {
      return res.status(404).json({
        status: "fail",
        message: "No question found with that ID"
      });
    }
    res.status(200).json({
      status: "success",
      message: "Question successfully updated",
      data: {
        updateExam
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error updating the question',
      error: error.message
    });
  }
};



export const addSubjectToSchool = async (req, res) => {
  try {
    const { subjectName, actualName } = req.body;

    // Log the body to check what's being received
    console.log(req.body);

    // Find the school by its ID
    const school = await Exam.findById(req.params.schoolid);

    if (!school) {
      return res.status(404).json({
        status: "fail",
        message: "No school found with that ID"
      });
    }

    // Check if a subject with the same subjectName or actualName already exists
    const existingSubject = school.subjects.find(
      (subject) => subject.subjectName === subjectName || subject.actualName === actualName
    );

    if (existingSubject) {
      return res.status(400).json({
        status: "fail",
        message: "Subject with this name already exists"
      });
    }

    // Create the new subject object
    const newSubject = {
      subjectName: subjectName,
      actualName: actualName,
      arrayOfQuestions: []  // Empty questions array
    };

    // Push the new subject to the subjects array
    school.subjects.push(newSubject);

    // Save the updated school document
    await school.save();

    // Return the updated school document as the response
    res.status(200).json({
      status: "success",
      message: "Subject successfully added to the school",
      data: {
        school
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error adding subject to the school',
      error: error.message
    });
  }
};



export const addTopicToSubject = async (req, res) => {
  try {
    const { month, topicName, subjectName } = req.body;

    // Find the school by its ID
    const school = await Exam.findById(req.params.schoolid);

    if (!school) {
      return res.status(404).json({
        status: "fail",
        message: "No school found with that ID"
      });
    }

    // Find the subject by its subjectName
    const subject = school.subjects.find(sub => sub.subjectName === subjectName);

    if (!subject) {
      return res.status(404).json({
        status: "fail",
        message: "No subject found with that name"
      });
    }

    // Create the new topic object
    const newTopic = {
      month: month,
      topicName: topicName,
      actualQuestion: []  // Empty questions array
    };

    // Push the new topic to the arrayOfQuestions in the subject
    subject.arrayOfQuestions.push(newTopic);

    // Save the updated school document
    await school.save();

    // Return the updated school document as the response
    res.status(200).json({
      status: "success",
      message: "Topic successfully added to the subject's arrayOfQuestions",
      data: {
        school
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error adding topic to the subject',
      error: error.message
    });
  }
};

export const addQuestionToTopic = async (req, res) => {
  try {
    const { subjectName, topicName, textContent, type } = req.body;
    const { schoolid } = req.params;

    // Fetch the school document
    const school = await Exam.findById(schoolid);

    if (!school) {
      return res.status(404).json({
        status: "fail",
        message: "No school found with that ID"
      });
    }

    // Find the subject by name
    const subject = school.subjects.find(sub => sub.subjectName === subjectName);
    if (!subject) {
      return res.status(404).json({
        status: "fail",
        message: "No subject found with that name"
      });
    }

    // Find the topic by name
    const topic = subject.arrayOfQuestions.find(t => t.topicName === topicName);
    if (!topic) {
      return res.status(404).json({
        status: "fail",
        message: "No topic found with that name in the subject"
      });
    }

    // Handling both text and image
    let contentArray = [];

    // Check if text content is provided
    if (textContent) {
      contentArray.push({
        type: "text",
        value: textContent
      });
    }

    // Check if image content is uploaded (it will be handled in `resizeQuestionImages`)
    if (req.body.value) {
      contentArray.push({
        type: "image",
        value: req.body.value  // Image URL from `resizeQuestionImages`
      });
    }

    // Create the new question object
    const newQuestion = {
      id: req.body.id,
      easy: req.body.easy,
      type: req.body.type,
      year: req.body.year,
      exambody: req.body.exambody,
      subtopic: req.body.subtopic,
      content: contentArray, // Text and/or Image content array
      options: req.body.options
    };

    if (!req.body.options || !Array.isArray(req.body.options)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid options array'
      });
    }

    // Push the new question to the topic's actualQuestion array
    topic.actualQuestion.push(newQuestion);

    // Save the updated school document
    await school.save();

    // Respond with the updated school data
    res.status(200).json({
      status: "success",
      message: "Question successfully added with text and/or image",
      data: {
        school
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error adding question to the topic',
      error: error.message
    });
  }
};








// // const fs=require("fs")
// // const express = "express";
// import fs from "fs"
// // exports. getAllquestions = async(req,res)=>{
// //     try {
// //         const myExam= await exam;
// //         res.status(200).json({
// //             status:"sucess",
// //             numResult:exam.length,z
// //             data:{
// //                 exam
// //             }
// //         })
// //     } catch (error) {
// //         res.status(500).json({error});
// //     }
// // }
// import Exam from "../model/questionModel.js"

// export const getAllQuestions = async (req, res) => {
//     try {
//       const allExams=await Exam.find()
//         res.status(200).json({
//           status:"success",
//           message:"All question get sucessfully ",
//           numResults:allExams.length,
//           data:{
//             allExams
//           }
//         }) 
 
//      } catch (error) {
//       res.status(500).json({error});
//      }
//   };
  
// //  exports.getOneQuestion = async (req,res)=>{
// //    try {
// //     const myResult= await exam.find(oneSchool=>oneSchool.id === req.params.schoolid);
// //     res.status(200).json({
// //         status:"sucess",
// //         data:{
// //            myResult
// //         }
// //     })
// //    } catch (error) {
// //     res.status(500).json({error});
// //    }
// // }
// export const getOneQuestion = async (req,res)=>{
  
//     try {
//       const oneExam = await Exam.findById(req.params.id)
//         res.status(200).json({
//           status:"success",
//           message:"A question get sucesssfully",
//           data:{
//             oneExam
//           }
//         }) 
 
//      } catch (error) {
//       res.status(500).json({error});  
//      }
//  }
// // exports.postQuestion = async(req,res)=>{
// //     try {
// //        res.status(200).json({
// //          status:"success",
// //          message:"questions successfully created"
// //        }) 

// //     } catch (error) {
        
// //     }
// // }
// export const createQuestion = async(req,res)=>{
//     try {
//       const createExam = await Exam.create(req.body)
//       console.log(createExam)
//         res.status(200).json({
//           status:"success",
//           message:"questions successfully created",
//           data:{
//            createExam
//           }
//         }) 
 
//      } catch (error) {
//       res.status(500).json({error});
//      }
 
// }

// // 
// export const deleteQuestion = async(req,res)=>{
//   await Exam.findByIdAndDelete(req.params.id);
//     try {
//        res.status(200).json({
//          status:"success",
//          message:"questions successfully deleted"
//        }) 

//     } catch (error) {
//       res.status(500).json({error});
//     }
// }

// // exports.updateQuestion = async(req,res)=>{
// //     try {
// //        res.status(200).json({
// //          status:"success",
// //          message:"questions successfully updated"
// //        }) 

// //     } catch (error) {
        
// //     }
// // }
// export const updateQuestion = async(req,res)=>{
//     try {
//       const updateExam = await Exam.findByIdAndUpdate(req.params.id,req.body,{
//         new:true,
//         runValidators:true,
//       })
//        res.status(200).json({
//          status:"success",
//          message:"questions successfully updated"
//        }) 

//     } catch (error) {
//       res.status(500).json({error}); 
//     }
// }