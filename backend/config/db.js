const mongoose=require("mongoose");

const connectDB=async ()=>{
    try{
        const conn=await mongoose.connect(process.env.MONGO_URI);
        console.log('mongo db connected successfully');

    }
    catch(error){
        console.error('mongo db connection failed:',error.message);
        process.exit(1);
    }
};
module.exports=connectDB;