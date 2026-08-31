import genToken from "../config/token.js";
import User from "../models/user.model.js";


export const googleAuth = async (req,res) => {
    try {
        const {name, email} = req.body
        let user = await User.findOne({email})
        if(!user){
            user= await User.create({
                name,//key or value dono same h isliye hamne esa kiya h 
                email
            })
        }

        let token = await genToken(user._id)
        res.cookie("token", token,{
                  httpOnly:true,
                  secure:true,
                  sameSite:"none",
                  maxAge:7 * 24 * 60 *60 *1000
        })
        return res.status(200).json(user)

    }catch (error) {
        return res.status(500).json({message:`Google auth error ${error}`})    }
}

//logout function
export const logout = async (req,res)=>{
    try {
        await   res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            path: "/"
        })
        
        return res.status(200).json({message:"lougout suucessfully"})
    }catch(error){
        return res.status(500).json({
            message:`lougout error ${error}`})
    }
}