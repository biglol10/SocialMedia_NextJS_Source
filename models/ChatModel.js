const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" }, // whose model it is
  chats: [
    // Array of all the chats that the user has, chats with multiple users
    {
      messagesWith: { type: Schema.Types.ObjectId, ref: "User" },
      messages: [
        {
          msg: { type: String, required: true },
          sender: { type: Schema.Types.ObjectId, ref: "User" },
          receiver: { type: Schema.Types.ObjectId, ref: "User" },
          date: { type: Date },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Chat", ChatSchema);
