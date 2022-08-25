const jwt = require("jsonwebtoken");
const formate = require("../module/formate");


const auth= async (req,rs,next)=>{
    try{
        const token=req.cookies.jwt;
        const verify= jwt.verify(token,process.env.SECRET_KEY);
        const find=await formate.findOne({_id:verify._id});
        req.token=token;
        req.data=find;
        next();
        
    }catch(error){
        console.log(error);
    }
}


module.exports=auth;

