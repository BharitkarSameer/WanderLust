const mongoose = require("mongoose");
const Listing = require("../models/listing");
const sampleData = require("./data_modified");
const fetch = require("node-fetch");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/airbnb");
  console.log("MongoDB connected.");
}

// Step 3: Function to convert address to coordinates using OpenStreetMap Nominatim
async function getCoordinates(location) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }
  } catch (err) {
    console.error(`Error getting coordinates for: ${location}`, err);
  }
  return [0, 0]; // fallback if nothing found or API fails
}

// Step 4: Delay function (to respect 1 request/sec)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Step 5: Main logic to add data
async function addData(sampleData) {
  await Listing.deleteMany();
  const listingsWithGeometry = [];

  for (let obj of sampleData.data) {
    const coordinates = await getCoordinates(obj.location);
    await delay(1000); // Add delay after each API call

    listingsWithGeometry.push({
      ...obj,
      owner: "685e8f19608fc2bacdc1edd1",
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
    });

    console.log(`Processed: ${obj.title} → ${coordinates}`);
  }

  await Listing.insertMany(listingsWithGeometry);
  console.log("All listings inserted with coordinates.");
}

main()
  .then(() => addData(sampleData))
  .catch((err) => console.error("Something went wrong:", err));
