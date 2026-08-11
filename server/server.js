const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);

require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

console.log("Server file started");
console.log("Mongo URI:", process.env.MONGO_URI ? "Found" : "Missing");

connectDB()
.then(() => {
    console.log("Database connected, starting server...");

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

})
.catch((error) => {
    console.log("Connection Error:", error);
});