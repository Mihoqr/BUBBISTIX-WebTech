import dotenv from "dotenv";
dotenv.config();

import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import { Category } from "../models/category.model.js";

// Configure multer to upload files directly to AWS S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    // Attach basic metadata to uploaded file
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },

    // Generate dynamic S3 file path based on category
    key: async function (req, file, cb) {
      try {

        const { category_id } = req.body;

        // Ensure category_id is provided
        if (!category_id) {
          return cb(new Error("category_id is required"));
        }

        // Validate that the category exists
        const category = await Category.findById(category_id);

        if (!category) {
          return cb(new Error("Invalid category"));
        }

        const slug = category.slug;

        // Store preview images inside category folder
        if (file.fieldname === "preview_images") {

          cb(null, `previews/${slug}/${file.originalname}`);

          // Store sticker zip files in stickers folder
        } else if (file.fieldname === "sticker_zip") {

          cb(null, `stickers/${file.originalname}`);

        } else {

          cb(new Error("Invalid upload field"));

        }

      } catch (error) {

        cb(error);

      }
    }
  })
});

export default upload;