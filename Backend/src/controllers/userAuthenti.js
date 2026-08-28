const express = require("express");
const validate = require("../utils/validators");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

const register = async (req, res) => {
    try {
        validate(req.body);
        const { firstName, emailId, passWord } = req.body;
        const hashedPassword = await bcrypt.hash(passWord, 10);
        req.body.passWord = hashedPassword;
        req.body.role = 'user';

        const reqUser = await User.create(req.body);
        const token = jwt.sign(
            { _id: reqUser._id, emailId: emailId, role: reqUser.role },
            process.env.SECRET_KEY,
            { expiresIn: 60 * 60 }
        );

        const reply = {
            firstName: reqUser.firstName,
            emailId: reqUser.emailId,
            id: reqUser._id,
            role: reqUser.role,
            problemSolved: reqUser.problemSolved || [],
            profilePic: reqUser.profilePic || '',
            gender: reqUser.gender || '',
            location: reqUser.location || '',
            birthday: reqUser.birthday || null,
            websites: reqUser.websites || '',
            education: reqUser.education || '',
            skills: reqUser.skills || []
        };

        res.cookie('token', token, { maxAge: 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
        res.status(201).json({
            user: reply,
            message: "User Created Successfully"
        });
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
};

const login = async (req, res) => {
    try {
        const { emailId, passWord } = req.body;
        if (!emailId || !passWord) {
            return res.status(400).send("Invalid Credentials");
        }

        const reqUser = await User.findOne({ emailId });

        if (!reqUser) {
            return res.status(404).send("User not found");
        }

        const isValid = await bcrypt.compare(passWord, reqUser.passWord);
        if (!isValid) {
            return res.status(401).send("Invalid Credentials");
        }

        const token = await jwt.sign(
            { _id: reqUser._id, emailId: emailId, role: reqUser.role },
            process.env.SECRET_KEY,
            { expiresIn: 60 * 60 }
        );

        const reply = {
            firstName: reqUser.firstName,
            lastName: reqUser.lastName || '',
            emailId: reqUser.emailId,
            id: reqUser._id,
            role: reqUser.role,
            problemSolved: reqUser.problemSolved || [],
            profilePic: reqUser.profilePic || '',
            gender: reqUser.gender || '',
            location: reqUser.location || '',
            birthday: reqUser.birthday || null,
            websites: reqUser.websites || '',
            education: reqUser.education || '',
            skills: reqUser.skills || [],
            age: reqUser.age || ''
        };

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });

        res.status(201).json({
            user: reply,
            message: "User Logged in Successfully"
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Error: " + err.message);
    }
};

const logout = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) return res.status(400).send("No token provided");

        const payload = jwt.decode(token);
        if (payload) {
            await redisClient.set(`token:${token}`, "Blocked");
            const ttl = payload.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) await redisClient.expire(`token:${token}`, ttl);
        }
        res.clearCookie('token');
        res.send("User Logged Out Successfully");
    } catch (err) {
        console.log("Logout error:", err);
        res.status(500).send("Error: " + err.message);
    }
};

const adminRegister = async (req, res) => {
    try {
        validate(req.body);
        const { firstName, emailId, passWord } = req.body;
        const hashedPassword = await bcrypt.hash(passWord, 10);
        req.body.passWord = hashedPassword;
        req.body.role = 'admin';

        const reqUser = await User.create(req.body);
        const token = jwt.sign(
            { _id: reqUser._id, emailId: emailId, role: 'admin' },
            process.env.SECRET_KEY,
            { expiresIn: 60 * 60 }
        );

        const reply = {
            firstName: reqUser.firstName,
            emailId: reqUser.emailId,
            id: reqUser._id,
            role: reqUser.role,
            problemSolved: reqUser.problemSolved || [],
            profilePic: reqUser.profilePic || '',
            gender: reqUser.gender || '',
            location: reqUser.location || '',
            birthday: reqUser.birthday || null,
            websites: reqUser.websites || '',
            education: reqUser.education || '',
            skills: reqUser.skills || []
        };

        res.cookie('token', token, { maxAge: 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
        res.status(201).json({
            user: reply,
            message: "Admin created Successfully"
        });
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.result._id;
        const { 
            firstName, 
            lastName, 
            age, 
            gender, 
            location, 
            birthday, 
            websites, 
            education, 
            skills 
        } = req.body;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (age) updateData.age = age;
        if (gender) updateData.gender = gender;
        if (location) updateData.location = location;
        if (birthday) updateData.birthday = new Date(birthday);
        if (websites) updateData.websites = websites;
        if (education) updateData.education = education;
        if (skills) updateData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        
        if (req.file) {
            updateData.profilePic = `/uploads/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select("_id firstName lastName emailId age gender location birthday websites education skills role problemSolved profilePic");

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.status(200).json({
            user: updatedUser,
            message: "Profile updated successfully"
        });
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.result._id)
            .select("_id firstName lastName emailId age gender location birthday websites education skills role problemSolved profilePic");
        res.status(200).json({ user });
    } catch (err) {
        res.status(404).send("Error: " + err.message);
    }
};

const getGlobalRanking = async (req, res) => {
    try {
        const users = await User.find({})
            .select("_id firstName lastName emailId problemSolved")
            .sort({ problemSolved: -1 });
        
        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            userId: user._id,
            name: `${user.firstName} ${user.lastName || ""}`.trim(),
            emailId: user.emailId,
            problemsSolved: user.problemSolved.length
        }));
        
        res.status(200).json({ leaderboard });
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

module.exports = { register, login, logout, adminRegister, getProfile, updateProfile, upload, getGlobalRanking };