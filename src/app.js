require('dotenv').config();
const express = require("express");
const app = express();
const port = process.env.PORT
require("./db/conn");
const path = require("path");
const hbs = require("hbs");
const Register = require("./module/formate");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cooki = require("cookie-parser");
const { userInfo } = require('os');
const auth = require("./middeleware/auth");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const public = (path.join(__dirname, "../public"))
const viewpath = (path.join(__dirname, "../template/views"));
const partalpath = (path.join(__dirname, "../template/partials"));

app.use(cooki());
app.use(express.static(public))
app.set("view engine", "hbs");
app.set("views", viewpath);
hbs.registerPartials(partalpath);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));





app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});



app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const Cpassword = req.body.confirmpass;
        // const phone=req.body.phone;
        if (password === Cpassword) {
            const data = new Register({
                fname: req.body.fname,
                email: req.body.email,
                phone: req.body.phone,
                gender: req.body.gender,
                password: password,
                confirmpass: Cpassword
            });

            const hostname = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASS
                }
            });

            const sender = {
                from: process.env.EMAIL,
                to: req.body.email,
                subject: "welcome to my web",
                text: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Numquam nemo explicabo suscipit exercitationem, obcaecati, maxime asperiores et aut sapiente itaque esse fugiat? Fuga labore, aliquid consectetur beatae accusantium nobis ips "

            };

            hostname.sendMail(sender, (error) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log("send")
                }
            });

            const token = await data.createtoken();
            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 100000),
                httpOnly: true
            });



            await data.save();
            res.render("register");
        } else {
            res.send("pass not match");
            console.log()
        }
    } catch (error) {
        console.log(error)
    }
});

const createotp = new mongoose.Schema({

    otp: {
        type: String,
        require: true,
        expires: '1m',
        index: true
    },
    email: {
        type: String
    }
});
const newotp = new mongoose.model(process.env.NEWDATA, createotp);

app.post("/otp", async (req, res) => {
    try {
        const otp = req.body.otp;
        // console.log({ otp });
        const email = req.body.email;
        // console.log({ email });      

        const nemail = await newotp.findOne({ email: email })
        const comp = await newotp.findOne({nemail,otp:otp});
        if (comp) {
            res.render("index");
        } else {
            res.send("not match")
            }
        } catch (error) {
            console.log(error);
            res.send("otp invalid");
        }
    })


app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;

        const password = req.body.password;

        const user = await Register.findOne({ email: email });

        const ismatch = await bcrypt.compare(password, user.password);


        if (ismatch) {

            var otpcode = Math.floor(Math.random() * 1000 * 10)
            const data = new newotp({
                otp: otpcode,
                email: req.body.email
            });
            data.save();
            const token = await user.createtoken();
            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 1000000),
                httpOnly: true
            });
            res.render("otp");
        } else {
            res.send("not found");
        }


        const hostname = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS
            }
        });

        const sender = {
            from:process.env.EMAIL,
            to: req.body.email,
            subject: `${otpcode} log in mail`,
            text: `${otpcode} login send `,
            html: `<b> your log in code ${otpcode}  </b>`

        };

        hostname.sendMail(sender, (error) => {
            if (error) {
                console.log(error);
            } else {

                console.log("send")
            }
        });

    } catch (error) {
        res.send("not match")

        console.log(error)
    }
});

app.get("/logout", auth, async (req, res) => {

    try {
        req.data.tokens = req.data.tokens.filter((currtoken) => {
            return currtoken.token !== req.token;
        });
        res.clearCookie("jwt");
        await req.data.save();
        res.render("login");
    } catch (error) {
        console.log(error);
    }

});


app.get("/logall", auth, async (req, res) => {
    try {

        req.data.tokens = [];
        res.clearCookie("jwt");
        await req.data.save();
        res.render("login");

    } catch (error) {
        console.log(error);
    }
});



app.get("/forgot", (req, res) => {
    res.render("forgot")
});

app.post("/forgot", async (req, res) => {
    try {
        const email = req.body.email;
        const password = await bcrypt.hash(req.body.password, 10);
        if (email) {
            const data = await Register.findOneAndUpdate({ email: email }, { $set: { password: password } });
            await data.save();
            res.render("login")
        }
    } catch (error) {
        res.send("email not match")
        console.log(error)
    }
});

app.get("/delete", (req, res) => {
    res.render("delete");
});


app.post("/delete", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await Register.findOne({ email: email });
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const userdata = await Register.deleteOne({ email: email });
            // await userdata.save();
            res.render("register");
        } else {
            res.send('enter valid data')
        }
    } catch (error) {
        res.send("enter  vald dta")
        console.log(error)
    }
})

app.listen(port, (req, res) => {
    console.log(`listen port no :${port}`)
})
