const mongoose = require("mongoose")



const dbConnection = () => {
    mongoose.connect("mongodb+srv://santosh:uUdNOh2CI0v9fxL1@cluster0.jzjxoee.mongodb.net/chatAppDatabase")
        .then(() => {
            console.log("database connected successfully");

        }).catch((error) => {
            console.log("database not connected cheack", error);

        })
}

module.exports = dbConnection;