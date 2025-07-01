const mongoose=require("mongoose");
const Listing=require("../models/listing");
const sampleData=require("./data_modified");

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/airbnb");
}

main()
.then(()=>console.log("connection succesful"))
.catch((err)=>console.log(err));

// console.log(sampleData);

async function addData(sampleData) {
    await Listing.deleteMany();
    sampleData=sampleData.map((obj)=>({...obj,owner:"685e8f19608fc2bacdc1edd1"}));
    await Listing.insertMany(sampleData);
}

addData(sampleData.data)
.then((res)=>console.log(res))
.catch(err=>console.log(err));