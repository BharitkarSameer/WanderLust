// ----------------------------
// 🌐 Environment Configuration
// ----------------------------
if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

// ----------------------------
// 🔧 Required Dependencies
// ----------------------------
const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ejsMate = require("ejs-mate");
const multer = require("multer");
const fetch = require("node-fetch");


// ----------------------------
// ⚙️ Project Configs & Utils
// ----------------------------
const port = 8080;
const ExpressError = require("./utils/ExpressError");
const asyncWrap = require("./utils/asyncWrap");
const { validationSchema, reviewValidation } = require("./schema");

// ----------------------------
// 🧠 Mongoose Models
// ----------------------------
const Listing = require("./models/listing");
const Review = require("./models/review");
const User = require("./models/user");

// ----------------------------
// ☁️ Cloudinary Configuration
// ----------------------------
const { storage } = require("./cloudConfig");
const upload = multer({ storage });

// ----------------------------
// 🧪 Database Connection
// ----------------------------

const dbUrl=process.env.ATLASDB_URL;
async function main() {
  await mongoose.connect(dbUrl);
}
main()
  .then(() => console.log("✅ MongoDB connection successful"))
  .catch((err) => console.log(err));

// ----------------------------
// 🧠 View Engine Configuration
// ----------------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ----------------------------
// 📂 Middleware: General
// ----------------------------
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ----------------------------
// 🔐 Session & Flash Config
// ----------------------------


const store=MongoStore.create({
  mongoUrl: dbUrl,
  crypto:{
    secret:process.env.SECRET,
  },
  touchAfter: 24 *3600,
})

store.on("error",()=>{
  console.log("ERROR IN MONGO STORE",err);
});

let sessionOptions = {
  store:store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
};

app.use(session(sessionOptions));
app.use(flash());

// ----------------------------
// 🔐 Passport Authentication
// ----------------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ----------------------------
// 🌍 Local Variables Middleware
// ----------------------------
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.failure = req.flash("failure");
  res.locals.error = req.flash("error");
  res.locals.user = req.user;
  next();
});

// ----------------------------
// 🛡️ Middleware Functions
// ----------------------------

// Validate new/edit listings
let validateListing = (req, res, next) => {
  let result = validationSchema.validate(req.body);
  if (result.error) throw new ExpressError(400, result.error);
  next();
};

// Validate new review
let validateReview = (req, res, next) => {
  let result = reviewValidation.validate(req.body);
  if (result.error) throw new ExpressError(400, result.error);
  next();
};

// Check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in first!");
    return res.redirect("/login");
  }
  next();
};

// Check if listing is owned by user
const isOwner = async (req, res, next) => {
  let id = req.params.id;
  const listing = await Listing.findById(id).populate("owner");
  if (!listing.owner._id.equals(req.user._id)) {
    req.flash("error", "You don't own this listing!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// Check if review is authored by user
const isAuthor = async (req, res, next) => {
  let { id, reviewid } = req.params;
  let review = await Review.findById(reviewid).populate("author");
  if (!review.author._id.equals(req.user._id)) {
    req.flash("error", "This review isn't written by you.");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// Save redirect URL if not logged in
const saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// ----------------------------
// 👤 User Authentication Routes
// ----------------------------

// Sign Up
app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

app.post("/signup", async (req, res) => {
  try {
    let { username, email, password } = req.body;
    let newUser = new User({ username, email });
    let registeredUser = await User.register(newUser, password);
    req.logIn(registeredUser, (err) => {
      if (err) throw new ExpressError(500, err);
      req.flash("success", "User registered successfully!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("failure", `${err}`);
    res.redirect("/signup");
  }
});

// Login
app.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

app.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),
  (req, res) => {
    req.flash("success", "You have logged in successfully! Welcome to WanderLust!");
    if (res.locals.redirectUrl) return res.redirect(res.locals.redirectUrl);
    res.redirect("/listings");
  }
);

// Logout
app.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) throw new ExpressError(500, err);
    req.flash("success", "You have been logged out successfully");
    res.redirect("/listings");
  });
});

// ----------------------------
// 🏡 Listing Routes
// ----------------------------

//Additional pages includinfg home terms privacy and company details for the page 


app.get("/",(req,res)=>{
  res.render("additional/home.ejs");
})


app.get("/listings/terms",(req,res)=>{
  res.render("additional/terms.ejs");
})

app.get("/listings/privacy",(req,res)=>{
  res.render("additional/privacy.ejs");
})

app.get("/listings/companydetails",(req,res)=>{
  res.render("additional/companydetails.ejs");
})



// All listings
app.get("/listings", async (req, res) => {
  let { category } = req.query;
  let listingsdata = category && category !== "General"
    ? await Listing.find({ category })
    : await Listing.find({});
  res.render("listings/listings.ejs", { listingsdata });
});

// Individual listing
app.get("/listings/:id", async (req, res) => {
  let id = req.params.id;
  let listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("failure", "Requested listing doesn't exist!");
    return res.redirect("/listings");
  }
  res.render("listings/viewlisting.ejs", { listing });
});

// New listing form
app.get("/newlistings", isLoggedIn, (req, res) => {
  res.render("listings/newlisting.ejs");
});

// Create new listing
app.post("/listings", isLoggedIn, upload.single('image'), validateListing, async (req, res) => {
  const { title, description, price, country, location, category } = req.body;
  let newListing = new Listing({ title, description, price, country, location, category });
  newListing.owner = req.user._id;
  newListing.image = { url: req.file.path, filename: req.file.filename };

  // Get location coordinates
  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
  const data = await response.json();
  const coordinates = data.length ? [parseFloat(data[0].lon), parseFloat(data[0].lat)] : [0, 0];
  newListing.geometry = { type: "Point", coordinates };

  await newListing.save();
  req.flash("success", "New listing added!");
  res.redirect("/listings");
});

// Edit listing form
app.get("/listings/:id/edit", isLoggedIn, isOwner, async (req, res) => {
  let id = req.params.id;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("failure", "Requested listing doesn't exist anymore");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url.replace("/uploads", "/uploads/h_300,w_250/e_blur");
  res.render("listings/editlisting.ejs", { listing, originalImageUrl });
});

// Edit listing handler
app.put("/listings/:id/edit", isLoggedIn, isOwner, upload.single('image'), validateListing, async (req, res) => {
  let id = req.params.id;
  const { title, description, price, country, location, category } = req.body;

  let listing = await Listing.findByIdAndUpdate(id, { title, description, price, country, location, category });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
  const data = await response.json();
  const coordinates = data.length ? [parseFloat(data[0].lon), parseFloat(data[0].lat)] : [0, 0];
  listing.geometry = { type: "Point", coordinates };

  if (req.file) {
    listing.image = { url: req.file.path, filename: req.file.filename };
  }

  await listing.save();
  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
});

// Delete listing
app.delete("/listings/:id/delete", isLoggedIn, isOwner, async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
});

// ----------------------------
// 📝 Review Routes
// ----------------------------

// Create review
app.post("/listings/:id/reviews", isLoggedIn, validateReview, async (req, res) => {
  let id = req.params.id;
  let { comment, rating } = req.body;
  let newReview = new Review({ comment, rating, author: req.user._id });
  await newReview.save();

  let listing = await Listing.findById(id);
  listing.reviews.push(newReview);
  await listing.save();

  req.flash("success", "Review added!");
  res.redirect(`/listings/${id}`);
});

// Delete review
app.delete("/listings/:id/reviews/:reviewid", isLoggedIn, isAuthor, async (req, res) => {
  let { id, reviewid } = req.params;
  await Review.findByIdAndDelete(reviewid);
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewid } });
  req.flash("success", "Review deleted!");
  res.redirect(`/listings/${id}`);
});

// ----------------------------
// ⚠️ Error Handlers
// ----------------------------
app.use((req, res, next) => {
  throw new ExpressError(500, "Page not found");
});

app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;
  res.status(status).render("error.ejs", { message });
});

// ----------------------------
// 🚀 Start Server
// ----------------------------
app.listen(port, () => {
  console.log("🚀 Server is running on port", port);
});
