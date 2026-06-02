const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`) });

// Load models
const Role = require("./models/role");
const User = require("./models/user");
const DocPerm = require("./models/docperm");
const DocType = require("./models/doctype");

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

// Read JSON files
const roles = JSON.parse(fs.readFileSync(`${__dirname}/_data/roles.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, "utf-8"));
const docperms = JSON.parse(fs.readFileSync(`${__dirname}/_data/docperms.json`, "utf-8"));
const doctypes = JSON.parse(fs.readFileSync(`${__dirname}/_data/doctypes.json`, "utf-8"));

// Import into DB
const importData = async () => {
  try {
    await Role.create(roles);
    await DocPerm.create(docperms);
    await DocType.create(doctypes);
    await User.create(users);
    console.log("Data Imported...".green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await DocType.deleteMany();
    await DocPerm.deleteMany();
    await Role.deleteMany();
    await User.deleteMany();
    console.log("Data Destroyed...".red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
}
