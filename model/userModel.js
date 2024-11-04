// userModel.js
import crypto from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true
  },
  photo:{
    type:String,
    default:'default.jpg',
  },
  role: {
    type: String,
    enum: ['student', 'admin','teacher'],
    default: 'student'  // Default role is 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false  // Prevents password from being sent with any query by default
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE (so not on update)
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  active:{
    type:Boolean,
    default:true,
    select:false,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  });

// Hashing password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();  // If password isn't changed, continue

  this.password = await bcrypt.hash(this.password, 12);  // Hash the password with cost of 12
  this.passwordConfirm = undefined;  // Don't persist the passwordConfirm field
  next();
});

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');  // Generate a random token

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');  // Hash the token
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;  // Token expires in 10 minutes

  return resetToken;  // Return unencrypted token to be sent via email
};
// DELETE USER
userSchema.pre(/^find/, function(next){
  // this point to the currnt query
  this.find({active:{$ne:false}});
  next()
})
// Compare passwords
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};



userSchema.methods.createPasswordResetToken = function () {
const resetToken = crypto.randomBytes(32).toString('hex');

this.passwordResetToken = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');

this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes

return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;
