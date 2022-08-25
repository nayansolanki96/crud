const mongoose =require("mongoose");
mongoose.connect(process.env.COLLECTION).then(() => {
    console.log("connection successfull")
}).catch((err) => {
    console.log("not connected");
});