import Users from "../Models/Users.js";
import UserProfile from "../Models/UserProfile.js";
import ResetCode from "../Models/ResetCode.js";
import GoogleUser from "../Models/googleuser.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import axios from "axios";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyRecaptcha = async (token) => {
  if (!token) {
    throw new Error('reCAPTCHA token is required');
  }
console.log(process.env.RECAPTCHA_SECRET_KEY)
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );

    const data = response.data;
    
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return false;
    }
    
    // Optional: Check score for v3 reCAPTCHA
    if (data.score !== undefined && data.score < 0.5) {
      console.warn('reCAPTCHA score too low:', data.score);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    throw new Error('Failed to verify reCAPTCHA');
  }
};

export const signup = async (req, res) => {
    try {
        const { name, email, password, userType, recaptchaToken } = req.body;

        // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);

    if (!isRecaptchaValid) {
      return res.status(400).json({ 
        message: 'reCAPTCHA verification failed', 
        error: 'recaptcha-failed' 
      });
    }

        if (!userType) {
            return res.status(400).json({
                message: "userType is required",
                success: false
            });
        }

        const userExists = await Users.findOne({ email });

        if (userExists) {
            return res.status(409).json({
                message: "User Already exists",
                success: false
            });
        }

        const user = new Users({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            userType,
            onboardingCompleted:false
        });

        const savedUser = await user.save();  // ✅ Save user correctly

        return res.status(201).json({
            message: "Registered successfully",
            success: true,
            user: savedUser  // ✅ Send user in response
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
};



export const login = async (req, res) => {
    try {
        const { email, password,recaptchaToken } = req.body;
        const user = await Users.findOne({ email });
        const errorMsg = "Auth Failed..User password or username wrong";
        const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);

        if (!isRecaptchaValid) {
          return res.status(400).json({ 
            message: 'reCAPTCHA verification failed', 
            error: 'recaptcha-failed' 
          });
        }
        
        if (!user) {
            return res.status(403).json({
                message: errorMsg,
                success: false
            });
        }
        
        const isPassEqual = await bcrypt.compare(password, user.password);
        
        if (!isPassEqual) {
            return res.status(403).json({
                message: errorMsg,
                success: false
            });
        }
        
        const token = jwt.sign(
            { email: user.email, _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        
        return res.status(200).json({
            message: "Login successfully",
            success: true,
            token,
            name: user.name,
            userType: user.userType, // Send role explicitly for routing
            isNewUser: !user.onboardingCompleted // Indicate if user needs onboarding
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
};

// Add a new endpoint to save user profile data during onboarding
export const saveUserProfile = async (req, res) => {
    try {
        const { location, energyUsage, hasSolarPanels } = req.body;
        const userId = req.user._id;

        let profile = await UserProfile.findOne({ user: userId });

        if (profile) {
            profile.location = location;
            profile.energyUsage = energyUsage;
            profile.hasSolarPanels = hasSolarPanels;
        } else {
            profile = new UserProfile({
                user: userId,
                location,
                energyUsage,
                hasSolarPanels
            });
        }

        await profile.save();

        // ✅ Update user's onboarding status
        await Users.findByIdAndUpdate(userId, { onboardingCompleted: true });

        res.status(200).json({ 
            message: "Profile updated successfully", 
            success: true 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: "Server error", 
            success: false 
        });
    }
};

export const getuserprofile = async (req, res) => {
    try {
        const userId = req.user._id;
        let profile = await UserProfile.findOne({ user: userId }).populate('user', 'name email userType onboardingCompleted createdAt');
        
        if (!profile) {
            const user = await Users.findById(userId).select('name email userType onboardingCompleted createdAt');
            if (!user) {
                return res.status(404).json({ message: "User Not found" });
            }
            return res.status(200).json({
                user,
                needsOnboarding: !user.onboardingCompleted,
                location: "",
                energyUsage: "",
                hasSolarPanels: false
            });
        }
        res.status(200).json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const editprofile = async(req,res) => {
    try {
      const userId = req.user._id;
      const { location, energyUsage, hasSolarPanels, email, userType, walletAddress } = req.body;
      
      // Find and update the profile
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { user: userId },
        { 
          location, 
          energyUsage, 
          hasSolarPanels,
          ...(walletAddress !== undefined && { walletAddress })
        },
        { new: true }
      );
      
      if (!updatedProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // If email or userType are being updated, update the User document as well
      if (email || userType) {
        await Users.findByIdAndUpdate(
          userId,
          { 
            ...(email && { email }),
            ...(userType && { userType })
          }
        );
      }
      
      // Get the updated profile with populated user data
      const populatedProfile = await UserProfile.findOne({ user: userId }).populate('user', 'name email userType createdAt');
      
      res.status(200).json(populatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Server Error" });
    }
  };

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  export const resetpassword = async(req,res) => {
    try {
      const { email } = req.body;
      const user = await Users.findOne({email});
      
      if (!user) {
        // For security reasons, don't reveal if email exists or not
        return res.status(200).json({ 
          success: true, 
          message: 'If your email is registered, you will receive a reset code.' 
        });
      }
      
      // Generate a 6-digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
      await ResetCode.findOneAndDelete({ email }); // Remove any existing codes
      await new ResetCode({
        email,
        code: resetCode
      }).save();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'EcoGrid Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #15803d; margin-bottom: 20px;">EcoGrid Password Reset</h1>
            <p>You requested a password reset for your EcoGrid account. Use the following code to reset your password:</p>
            <div style="background-color: #f0f9f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h2 style="color: #15803d; margin: 0; letter-spacing: 5px;">${resetCode}</h2>
            </div>
            <p>This code will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              EcoGrid - Sustainable Energy Solutions
            </p>
          </div>
        `
      };
      
      try {
        // Use await here instead of callback
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send reset code email. Please try again.' 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Reset code sent successfully.' 
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'An error occurred. Please try again later.' 
      });
    }
  }

  export const verifycode = async(req,res)=>{
    try {
        const { email, code, newPassword } = req.body;
        // Validate inputs
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

     // Find the reset code record
     const resetRecord = await ResetCode.findOne({ email, code });
     if (!resetRecord) {
       return res.status(400).json({
         success: false,
         message: 'Invalid or expired code.'
       });
     }
     const user = await Users.findOne({ email });
     if (!user) {
       return res.status(400).json({
         success: false,
         message: 'User not found.'
       });
     }
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(newPassword, salt);
     user.password = hashedPassword;
     await user.save();

     await ResetCode.findByIdAndDelete(resetRecord._id);

     return res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now log in with your new password.'
      });
    } catch (error) {
        console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
    }
  }

// Google OAuth Login/Signup
export const googleAuth = async (req, res) => {
  try {
    const { credential, userType } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Verify the Google token securely
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists in regular Users collection
    let user = await Users.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // Check GoogleUser collection
      let googleUser = await GoogleUser.findOne({ email });
      
      if (!googleUser) {
        // Create new user
        isNewUser = true;
        
        // Create in regular Users collection with random password
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        user = new Users({
          name,
          email,
          password: await bcrypt.hash(randomPassword, 10),
          userType: userType || 'consumer',
          onboardingCompleted: false
        });
        await user.save();
        
        // Also create in GoogleUser collection
        googleUser = new GoogleUser({
          name,
          email,
          image: picture,
          userType: userType || 'consumer',
          onboardingCompleted: false
        });
        await googleUser.save();
      } else {
        // Google user exists but not in Users - sync them
        user = await Users.findOne({ email });
        if (!user) {
          const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          user = new Users({
            name: googleUser.name,
            email: googleUser.email,
            password: await bcrypt.hash(randomPassword, 10),
            userType: googleUser.userType,
            onboardingCompleted: googleUser.onboardingCompleted
          });
          await user.save();
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token,
      name: user.name,
      email: user.email,
      isNewUser: !user.onboardingCompleted,
      userType: user.userType,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Google authentication failed. Please try again.'
    });
  }
};