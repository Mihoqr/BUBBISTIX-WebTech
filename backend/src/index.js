import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";

// Load environment variables
dotenv.config({
    path: "./.env"
});

// Starts the server after a successful database connection
const startServer = async () => {
    try {
        await connectDB();

        // Handle server errors
        app.on("error", (error) => {
            console.log("ERROR", error);
            throw error;
        });

        // Start listening for requests
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port : ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("MongoDB connection failed...", error)
    }
}

startServer();