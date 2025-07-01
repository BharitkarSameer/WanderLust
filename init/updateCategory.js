const mongoose = require("mongoose");
const Listing = require("../models/listing"); // adjust path if needed

// Connect to MongoDB
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/airbnb");
  console.log("✅ Connected to MongoDB");
}

// Your inferCategory function
function inferCategory(title) {
  title = title.toLowerCase();

  if (title.includes("beach") || title.includes("coast") || title.includes("ocean")) return "Beach";
  if (title.includes("mountain") || title.includes("cabin") || title.includes("aspen")) return "Mountain";
  if (title.includes("treehouse") || title.includes("forest")) return "Treehouse";
  if (title.includes("ski")) return "Skiing";
  if (title.includes("city") || title.includes("downtown") || title.includes("loft")) return "Urban";
  if (title.includes("villa")) return "Villa";
  if (title.includes("lake")) return "Lakefront";
  if (title.includes("castle")) return "Historic";
  if (title.includes("desert")) return "Desert";
  if (title.includes("island")) return "Island";
  return "General";
}

async function updateCategories() {
  const listings = await Listing.find({});

  for (let listing of listings) {
    // Only add category if it doesn't already exist

      const category = inferCategory(listing.title);
      listing.category = category;
      await listing.save();
      console.log(`✔ Updated: ${listing.title} → ${category}`);

  }

  console.log("🎉 All listings updated with categories!");
}

main()
  .then(updateCategories)
  .catch((err) => console.error("❌ Error updating categories:", err));
