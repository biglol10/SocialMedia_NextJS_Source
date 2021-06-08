const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// going to have 3 types of notifications
// the user from whom the notification is
// the id of the post on which newlike is there (newComment)
const NotificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },

  notifications: [
    {
      type: {
        type: String,
        enum: ["newLike", "newComment", "newFollower"],
      },
      user: { type: Schema.Types.ObjectId, ref: "User" },
      post: { type: Schema.Types.ObjectId, ref: "Post" },
      commentId: { type: String },
      text: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Notification", NotificationSchema);
