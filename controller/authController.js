// authController.js

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; 
import crypto from 'crypto';  // to generate random token
import User from "../model/userModel.js";
import sendEmail from "../utilites/email.js";
import { promisify } from "util"; // Import the promisify utility

// Helper function to create a JWT
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Signup function
export const signup = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    const token = createToken(newUser._id);
    
    // Set cookie with the JWT token
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),  // 90 days expiry
      httpOnly: true,  // Make cookie inaccessible to JavaScript
      secure: process.env.NODE_ENV === "production",  // Send cookie over HTTPS only in production
    });

    res.status(201).json({
      status: "success",
      token,
      message: "Your account is successfully created",
      data: { newUser },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "Error adding user",
      error: error.message,
    });
  }
};

// Login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }

    const findUser = await User.findOne({ email }).select('+password');

    if (!findUser) {
      return res.status(404).json({
        status: "fail",
        message: "No user found with that email",
      });
    }

    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect password",
      });
    }

    const token = createToken(findUser._id);
    
    // Set cookie with the JWT token
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),  // 90 days expiry
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      status: "success",
      token,
      message: "Login successful",
      data:{
        findUser
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something went wrong during login',
      error: error.message,
    });
  }
};

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  // Check if the token is present in the Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; 
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // If no token was found, return a 401 Unauthorized response
  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "You are not logged in. Please log in to get access.",
    });
  }

  try {
    // Verify the token using JWT
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if the user still exists in the database
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    // Attach the user data to the request object
    req.user = freshUser;

    // Move to the next middleware
    next();

  } catch (err) {
    // Catch any errors that occur during token verification
    return res.status(401).json({
      status: "fail",
      message: "Token is invalid or has expired.",
      error: err.message,
    });
  }
};

// Restricting roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// Forgot password
export const forgetPassword = async (req, res) => {
  try {
    // 1. Get the user by email
    const currentUser = await User.findOne({ email: req.body.email });
    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "No user found with that email",
      });
    }

    // 2. Generate the password reset token
    const resetToken = currentUser.createPasswordResetToken();
    await currentUser.save({ validateBeforeSave: false });

    // 3. Construct reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // 4. Send the reset email
    const message = `Forgot your password? Submit a PATCH request with your new password and confirm it to: ${resetURL}. If you didn't request this, please ignore this email.`;
    await sendEmail({
      email: currentUser.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    // 5. Respond to the client
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });

  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something went wrong while sending the email',
      error: error.message,
    });
  }
};
// Reset password
// authController.js
export const resetPassword = async (req, res) => {
  try {
    // 1. Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2. Find the user with this token
    const currentUser = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // token should not have expired
    });

    if (!currentUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired.',
      });
    }

    // 3. Set new password
    currentUser.password = req.body.password;
    currentUser.passwordConfirm = req.body.passwordConfirm;
    currentUser.passwordResetToken = undefined;
    currentUser.passwordResetExpires = undefined;

    // 4. Save the updated user
    await currentUser.save();

    // 5. Log the user in by sending a JWT
    const token = createToken(currentUser._id);
    res.cookie('jwt', token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days expiry
      httpOnly: true,
    });

    res.status(200).json({
      status: 'success',
      token,
      message: 'Password reset successful!',
    });

  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something went wrong during password reset',
      error: error.message,
    });
  }
};



// Update password
export const updatePassword = async (req, res) => {
  try {
    console.log(req.file);
    console.log(req.body)
    // 1. Get the user from the collection using their JWT token
    const user = await User.findById(req.user.id).select('+password');

    // 2. Check if the posted current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your current password is incorrect',
      });
    }

    // 3. Update the password only if the current password is correct
    user.password = req.body.password;
    user.passwordConfirm = req.body.confirmPassword; // Should match with the field in your request body

    await user.save(); // Ensure the validation checks for passwordConfirm work here

    // 4. After updating, sign a new JWT token and send it to the client
    const token = createToken(user._id);

    // Set cookie with the new JWT token
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),  // 90 days expiry
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      status: 'success',
      token,
      message: 'Your password has been updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'An error occurred while updating the password',
      error: error.message,
    });
  }
};

// Delete account
export const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "Something went wrong while deleting the account",
      error: error.message,
    });
  }
};
// update 
// Function to filter allowed fields for update
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Update Me controller
export const updateMe = async (req, res) => {
  try {
    // 1) Create an error if user tries to update the password via this route
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        status: 'fail',
        message: 'This route is not for password updates. Please use /updateMyPassword.',
      });
    }

    // 2) Filter out unwanted fields that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,  // Return the newly updated object
      runValidators: true,  // Run validation on updated data
    });
    if (!updatedUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // 4) Send success response
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });

  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error updating user data',
      error: error.message,
    });
  }
};
// authController.js

export const logout = (req, res) => {
  // Invalidate the JWT by setting a cookie with an expired JWT
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // Cookie expires in 10 seconds
    httpOnly: true, // Cookie cannot be accessed or modified by JavaScript
  });

  res.status(200).json({
    status: 'success',
    message: 'You have successfully logged out',
  });
};



