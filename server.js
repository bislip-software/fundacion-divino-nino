const express = require("express");
const cors = require("cors");
const colors = require("colors");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const compression = require("compression");
const enforce = require("express-sslify");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");

const errorHandler = require("./middlewares/error");
const connectDB = require("./config/db");

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

// Server
const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Compresses payload
app.use(compression());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Prevent http param pollution
app.use(hpp());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Enforces HTTPS
if (process.env.NODE_ENV === "production") {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

// Use routes
app.use("/api", require("./routes"));

// Set static folder
app.use(express.static("./client/build"));
// Always renders index.html
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "client", "build", "index.html"))
);

// Central error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
