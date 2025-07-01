const mongoose=require("mongoose");
const User=require("./user");

let reviewSchema=new mongoose.Schema({
    comment:String,
    rating:Number,
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
})

let Review=mongoose.model("Review",reviewSchema);

module.exports=Review;