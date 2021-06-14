const UserModel = require("../models/UserModel");
const PostModel = require("../models/PostModel");
const {
  newLikeNotification,
  removeLikeNotification,
  newCommentNotification,
} = require("../utils/notificationActions");
const uuid = require("uuid").v4;

// userId = the user who is liking your post
const likeOrUnlikePost = async (postId, userId, like) => {
  try {
    const post = await PostModel.findById(postId);
    if (!post) return { error: "No Post found" };

    if (like) {
      const isLiked =
        post.likes.filter((like) => like.user.toString() === userId).length > 0;

      if (isLiked) return { error: "Post liked before" };

      await post.likes.unshift({ user: userId });

      await post.save();

      if (post.user.toString() !== userId) {
        await newLikeNotification(userId, postId, post.user.toString());
      }
    } else {
      const isLiked =
        post.likes.filter((like) => like.user.toString() === userId).length ===
        0; // check if the post has not been liked before
      if (isLiked) return { error: "Post not liked before" };

      const indexOf = post.likes
        .map((like) => like.user.toString())
        .indexOf(userId);

      await post.likes.splice(indexOf, 1);

      await post.save();

      if (post.user.toString() !== userId) {
        await removeLikeNotification(userId, postId, post.user.toString());
      }
    }

    const user = await UserModel.findById(userId);

    const { name, profilePicUrl, username } = user;

    return {
      success: true,
      name,
      profilePicUrl,
      username,
      postByUserId: post.user.toString(),
    };
  } catch (error) {
    return { error: "Server Error" };
  }
};

// user commented on post
const commentPost = async (postId, user, text) => {
  try {
    const post = await PostModel.findById(postId);
    if (!post) return { error: "No Post Found" };

    const newComment = {
      _id: uuid(),
      text,
      user: user._id,
      date: Date.now(),
    };

    if (post.user.toString() !== user._id) {
      await newCommentNotification(
        postId,
        newComment._id,
        user._id,
        post.user.toString(),
        text
      );
      return {
        success: true,
        equal: false,
        postUser: post.user.toString(),
        newComment,
      };
    } else {
      return {
        success: true,
        equal: true,
        postUser: post.user.toString(),
        newComment,
      };
    }
  } catch (error) {
    return { error: "Server Error" };
  }
};

module.exports = { likeOrUnlikePost, commentPost };
