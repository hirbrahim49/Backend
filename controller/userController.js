import User from "../model/userModel.js";
import multer from "multer";
import sharp from "sharp";

// Set up multer storage and filtering logic || if you are not using resizing
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // Set the file name to 'user-id-timestamp.extension'
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage();


const multerFilter = (req, file, cb) => {
  // Only allow image files
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload only images'), false);
  }
};

// Initialize multer with the storage and file filter configurations
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Now, use the `upload` middleware
export const uploadUserPhoto = upload.single('photo');
export const resizeUserPhoto =async (req,res,next) =>{
  req.file.filename =`user-${req.user.id}-${Date.now()}.jpeg`;
  if(!req.file) return next()
  await sharp(req.file.buffer)
  .resize(500,500)
  .toFormat('jpeg')
  .jpeg({quality:90})
  .toFile(`public/img/users/req.file.filename`);
  next()
}
export const getAllUser = async (req, res) => {
  try {
    const allUser = await User.find();
    res.status(200).json({
      status: "success",
      message: "All users fetched successfully",
      numResults: allUser.length,
      data: {
        allUser
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error fetching users',
      error: error.message
    });
  }
};

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found"
      });
    }
    res.status(200).json({
      status: "success",
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error fetching user',
      error: error.message
    });
  }
};
