const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const userdata = new mongoose.Schema({
    fname: {
        type: String,
        require: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        require: true,
        unique: true,
    },
    phone: {
        type: Number,
        require: true,
        unique: true
    },
    gender: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        require: true
    },
    confirmpass: {
        type: String,
        require: true
    },
    tokens: [{
        token: {
            type: String,
            require: true,
        }
    }]
});


userdata.methods.createtoken = async function () {
    try {
        const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        return token;
    } catch (error) {
        console.log(error);
    }
}




userdata.pre("save", async function (next) {
    if(this.isModified("password")){
    this.password =  await bcrypt.hash(this.password, 10);
    this.confirmpass = undefined;
    };

    next();
})

const Register = new mongoose.model(process.env.DATA, userdata);

module.exports = Register;
