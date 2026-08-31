import multer from "multer";

const storage = multer.diskStorage({
    destination: function(req,file ,cb){
        cb(null, "public")//public yaha uski destination h 
    },
    filename: function(req,file ,cb){
        const filename= Date.now() +"-"+file.originalname;//yaha per file kis name save hogi in  storage multer ka use krke
        cb(null, filename)// return kra rhe h null or filename
    }
})

export const uploade = multer({
    storage,
    limits: {fileSize:5* 1024 * 1024}, //5mb limit 
})