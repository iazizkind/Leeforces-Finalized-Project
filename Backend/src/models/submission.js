const mongoose=require("mongoose");
const express=require("express");
const {Schema}=mongoose;

const submissionSchema=new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    problemId:{
        type:Schema.Types.ObjectId,
        ref:'problem',
        required:true
    },
    code:{
        type:String,
        required:true
    },
    language:{
        type:String,
        enum:['c','c++','javascript','java','python'],
        required:true
    },
    status:{
        type:String,
        enum:['Accepted','Pending','Wrong Answer','Time Limit Exceeded','Compilation Error','Runtime Error','Internal Error'],
        default:'Pending'
    },
    runtime:{
        type:Number,
        default:0
    },
    memory:{
        type:Number,
        default:0
    },
    errorMessege:{
        type:String,
        default:''
    },
    testCasesPassed:{
        type:Number,
        default:0
    }
    ,totalTestCases:{
        type:Number,
        default:0
    }

},{
    timestamps:true
})

const submission=mongoose.model('submission',submissionSchema);
module.exports=submission;

