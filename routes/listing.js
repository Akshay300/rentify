const router = require("express").Router();
const multer = require("multer");

const Listing = require("../models/Listing");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddeware");

/* Configuration Multer for File Upload */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Store uploaded files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage });

/* CREATE LISTING */
router.post("/create", upload.array("listingPhotos"), async (req, res) => {
  try {
    /* Take the information from the form */
    const {
      creator,
      // category,
      // type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      // amenities,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    } = req.body;

    const listingPhotos = req.files

    if (!listingPhotos) {
      return res.status(400).send("No file uploaded.")
    }

    const listingPhotoPaths = listingPhotos.map((file) => file.path)

    console.log("listing paths--------->>>>>>",listingPhotoPaths);

    const newListing = new Listing({
      creator,
      // category,
      // type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      // amenities,
      listingPhotoPaths,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    })

    await newListing.save()

    res.status(200).json(newListing)
  } catch (err) {
    res.status(409).json({ message: "Fail to create Listing", error: err.message })
    console.log(err)
  }
});

/* GET lISTINGS BY CATEGORY */
router.get("/", async (req, res) => {
  const qCategory = req.query.category

  try {
    let listings
    if (qCategory) {
      listings = await Listing.find({ category: qCategory }).populate("creator")
    } else {
      listings = await Listing.find().populate("creator")
    }

    res.status(200).json(listings)
  } catch (err) {
    res.status(404).json({ message: "Fail to fetch listings", error: err.message })
    console.log(err)
  }
})

/* GET LISTINGS BY SEARCH */
router.get("/search/:search", async (req, res) => {
  const { search } = req.params

  try {
    let listings = []

    if (search === "all") {
      listings = await Listing.find().populate("creator")
    } else {
      listings = await Listing.find({
        $or: [
          { category: {$regex: search, $options: "i" } },
          { title: {$regex: search, $options: "i" } },
        ]
      }).populate("creator")
    }

    res.status(200).json(listings)
  } catch (err) {
    res.status(404).json({ message: "Fail to fetch listings", error: err.message })
    console.log(err)
  }
})

/* LISTING DETAILS */
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params
    const listing = await Listing.findById(listingId).populate("creator")
    res.status(202).json(listing)
  } catch (err) {
    res.status(404).json({ message: "Listing can not found!", error: err.message })
  }
})

// Get a single listing by ID
router.get("/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('creator', 'firstName lastName contact email');
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a listing by ID
router.put("/:id",authMiddleware, async (req, res) => {

  console.log("update the listing--------------->>>>***>>>>>",req.body);

  try {
    const listing = await Listing.findById(req.params.id);
  
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Ensure the authenticated user is the creator of the listing
    if (listing.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to update this listing" });
    }

    // Update listing fields with the request body data
    Object.assign(listing, req.body);

    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a listing by ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
   
    const listing = await Listing.findById(req.params.id);
   
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Ensure the authenticated user is the creator of the listing
    if (listing.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to delete this listing" });
    }

    await listing.deleteOne();
    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router
