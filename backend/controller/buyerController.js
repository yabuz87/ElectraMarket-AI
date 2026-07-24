import bcrypt from "bcrypt";
import Buyer from "../model/buyer.user.js";
import { generateToken } from "../lib/util.js";
import {
  createVerificationToken,
  hashVerificationToken,
  sendVerificationEmail,
} from "../lib/emailVerification.js";

const publicBuyer = (buyer) => ({
  _id: buyer._id,
  fullName: buyer.fullName,
  email: buyer.email,
  phone: buyer.phone,
  status: buyer.status,
  isVerified: buyer.isVerified,
});

export const signup = async (req, res, next) => {
  try {
    const fullName = req.body.fullName?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const phone = req.body.phone?.trim();

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await Buyer.findOne({ $or: [{ email }, { phone }] }).lean();
    if (existing) {
      return res.status(409).json({
        message:
          existing.email === email
            ? "Email is already registered"
            : "Phone number is already registered",
      });
    }

    const verification = createVerificationToken();
    const newUser = await Buyer.create({
      fullName,
      email,
      password: await bcrypt.hash(password, 10),
      phone,
      verificationTokenHash: verification.tokenHash,
      verificationTokenExpiresAt: verification.expiresAt,
    });

    try {
      await sendVerificationEmail({ email, fullName, token: verification.token });
    } catch (emailError) {
      await Buyer.deleteOne({ _id: newUser._id });
      emailError.statusCode = 503;
      return next(emailError);
    }

    return res.status(201).json({
      message: "Account created. Check your email to verify your account.",
      verificationRequired: true,
      email: newUser.email,
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const email = req.query.email?.trim().toLowerCase();
    const token = req.query.token?.trim();
    if (!email || !token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await Buyer.findOne({ email })
      .select("+verificationTokenHash +verificationTokenExpiresAt")
      .exec();
    const tokenIsValid =
      user?.verificationTokenHash &&
      user.verificationTokenExpiresAt > new Date() &&
      user.verificationTokenHash === hashVerificationToken(token);

    if (!tokenIsValid) {
      return res.status(400).json({ message: "Verification link is invalid or expired" });
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully. You can now log in.",
      verified: true,
    });
  } catch (error) {
    return next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await Buyer.findOne({ email })
      .select("+verificationTokenHash +verificationTokenExpiresAt")
      .exec();
    if (!user || user.isVerified) {
      return res.status(200).json({ message: "If the account exists, a verification email was sent" });
    }

    const verification = createVerificationToken();
    user.verificationTokenHash = verification.tokenHash;
    user.verificationTokenExpiresAt = verification.expiresAt;
    await user.save();
    await sendVerificationEmail({ email, fullName: user.fullName, token: verification.token });

    return res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await Buyer.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.isVerified) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before logging in",
      });
    }

    generateToken(user._id, "buyer", res);
    return res.status(200).json(publicBuyer(user));
  } catch (error) {
    return next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

export const check = (req, res) => res.status(200).json(req.user);

export const getAllBuyer = async (req, res, next) => {
  try {
    const users = await Buyer.find({})
      .select("-password -activityLogs -verificationTokenHash -verificationTokenExpiresAt")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(users);
  } catch (error) {
    return next(error);
  }
};
