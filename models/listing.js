const mongoose=require("mongoose");
const Review=require("./review");
const User=require("./user");
let listingSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    image:{
        url:String,
        filename:String,

    },
    price:{
        type:Number
    },
    location:{
        type:String
    },
    geometry: {
    type: {
        type: String, // "Point"
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
    }
    },    
    country:{
        type:String
    },
    reviews:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Review",
            }
        ],
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    category:{
        type:String,
        default:"General",
    }

})

listingSchema.post("findOneAndDelete",async (body)=>{
    await Review.deleteMany({_id:{$in:body.reviews}});
})

let Listing=mongoose.model("Listing",listingSchema);

module.exports=Listing;