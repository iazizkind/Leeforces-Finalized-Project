const validator=require("validator");

const validate=(data)=>{
    const mandatoryField=['firstName','emailId','passWord'];
    const isAllowed=mandatoryField.every(key=>key in data);
    if(!isAllowed){
        throw new Error("Invalid Credentials");
    }
    const isEmail=validator.isEmail(data.emailId);
    if(!isEmail){
        throw new Error("Invalid Email");
    }
    const isPassWord=validator.isStrongPassword(data.passWord);
    if(!isPassWord){
        throw new Error("Invalid Password");
    }
}

module.exports=validate;