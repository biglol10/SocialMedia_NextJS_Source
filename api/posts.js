const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const UserModel = require("../models/UserModel");
const PostModel = require("../models/PostModel");
const FollowerModel = require("../models/FollowerModel");
const uuid = require("uuid").v4;
const {
  newLikeNotification,
  removeLikeNotification,
  newCommentNotification,
  removeCommentNotification,
} = require("../utils/notificationActions");

// CREATE A POST
router.post("/", authMiddleware, async (req, res) => {
  const { text, location, picUrl } = req.body;

  if (text.length < 1)
    return res.status(401).send("Text must be at least 1 character");

  try {
    const newPost = {
      user: req.userId,
      text,
    };
    if (location) newPost.location = location;
    if (picUrl) newPost.picUrl = picUrl;

    const post = await new PostModel(newPost).save();

    const postCreated = await PostModel.findById(post._id).populate("user");

    return res.json(postCreated);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// GET ALL POSTS
router.get("/", authMiddleware, async (req, res) => {
  const { pageNumber } = req.query;

  const number = Number(pageNumber);
  const size = 8;

  const { userId } = req; // from authMiddleware

  const { role } = await UserModel.findOne({ _id: userId }); // if root user show all posts
  // console.log(role);

  try {
    // -- another(new) version

    // we don't need followers
    const loggedUser = await FollowerModel.findOne({ user: userId }).select(
      "-followers"
    );

    let posts = [];

    // in operator is mongodb operator and it needs an array to compare values
    // whatever values we put inside the array, it is going to compare with user property (think of sql in)
    // following.user is the ids user is following and ... is spreading it out because map returns an array
    // no need to use toString(), it will automatically work
    if (number === 1) {
      if (loggedUser.following.length > 0) {
        if (role === "root") {
          posts = await PostModel.find()
            .limit(size)
            .sort({ createdAt: -1 })
            .populate("user")
            .populate("comments.user");
        } else {
          posts = await PostModel.find({
            user: {
              $in: [
                userId,
                ...loggedUser.following.map((following) => following.user),
              ],
            },
          })
            .limit(size)
            .sort({ createdAt: -1 })
            .populate("user")
            .populate("comments.user");
        }
      } else {
        if (role === "root") {
          posts = await PostModel.find()
            .limit(size)
            .sort({ createdAt: -1 })
            .populate("user")
            .populate("comments.user");
        } else {
          posts = await PostModel.find({ user: userId })
            .limit(size)
            .sort({ createdAt: -1 })
            .populate("user")
            .populate("comments.user");
        }
      }
    } else {
      const skips = size * (number - 1);
      if (loggedUser.following.length > 0) {
        posts = await PostModel.find({
          user: {
            $in: [
              userId,
              ...loggedUser.following.map((following) => following.user),
            ],
          },
        })
          .skip(skips)
          .limit(size)
          .sort({ createdAt: -1 })
          .populate("user")
          .populate("comments.user");
      } else {
        posts = await PostModel.find({ user: userId })
          .skip(skips)
          .limit(size)
          .sort({ createdAt: -1 })
          .populate("user")
          .populate("comments.user");
      }
    }

    return res.json(posts);

    //  -- old version

    // let posts;

    // if (number === 1) {
    //   posts = await PostModel.find()
    //     .limit(size)
    //     .sort({ createdAt: -1 }) // descending
    //     .populate("user")
    //     .populate("comments.user");
    // } else {
    //   const skips = size * (number - 1);
    //   posts = await PostModel.find()
    //     .skip(skips)
    //     .limit(size)
    //     .sort({ createdAt: -1 })
    //     .populate("user")
    //     .populate("comments.user");
    // }
    // const { userId } = req; // get from middleware
    // const loggedUser = await FollowerModel.findOne({ user: userId });

    // if (posts.length === 0) {
    //   return res.json([]);
    // }

    // let postsToBeSent = [];

    // if (loggedUser.following.length === 0) {
    //   // if the user is not following anyone
    //   postsToBeSent = posts.filter(
    //     (post) => post.user._id.toString() === userId
    //   ); // get posts of logged in user
    // } else {
    //   for (let i = 0; i < loggedUser.following.length; i++) {
    //     const foundPosts = posts.filter(
    //       (post) =>
    //         post.user._id.toString() ===
    //           loggedUser.following[i].user.toString() || // checking for the posts the user is following
    //         post.user._id.toString() === userId
    //     );
    //     if (foundPosts.length > 0) postsToBeSent.push(...foundPosts);
    //   }
    // }

    // return res.json(postsToBeSent);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// GET POST BY ID
router.get("/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.postId)
      .populate("user")
      .populate("comments.user");

    if (!post) {
      return res.status(404).send("Post not found");
    }

    return res.json(post);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// DELETE POST
router.delete("/:postId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req; // from authMiddleware
    const { postId } = req.params;

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).send("post not found");
    }

    const user = await UserModel.findById(userId);

    // in Postmodel user is a string to convert to string, otherwise it will not work
    if (post.user.toString() !== userId) {
      if (user.role === "root") {
        await post.remove();
        return res.status(200).send("Post delete Successfuly");
      } else {
        return res.status(401).send("Unauthorized");
      }
    }

    // if the user who asked for this post is the user actually deleting it, then delete
    await post.remove();
    return res.status(200).send("Post delete Successfuly");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// LIKE A POST
router.post("/like/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req;

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).send("No Post Found");
    }

    const isLiked =
      post.likes.filter((like) => like.user.toString() === userId).length > 0; // if >0 post is already liked

    if (isLiked) {
      return res.status(401).send("Post alreay liked");
    }

    await post.likes.unshift({ user: userId }); // unshift() 메서드는 새로운 요소를 배열의 맨 앞쪽에 추가하고, 새로운 길이를 반환합니다.

    await post.save();

    if (post.user.toString() !== userId) {
      // another user is liking your post
      await newLikeNotification(userId, postId, post.user.toString());
    }

    return res.status(200).send("Post liked");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// UNLIKE A POST
router.put("/unlike/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req;

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).send("No Post Found");
    }

    const isLiked =
      post.likes.filter((like) => like.user.toString() === userId).length === 0; // post has not been liked before

    if (isLiked) {
      return res.status(401).send("Post not liked before");
    }

    const index = post.likes
      .map((like) => like.user.toString())
      .indexOf(userId);
    await post.likes.splice(index, 1);

    await post.save();

    if (post.user.toString() !== userId) {
      // another user is liking your post
      await removeLikeNotification(userId, postId, post.user.toString());
    }

    return res.status(200).send("Post Unliked");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// GET ALL LIKES
router.get("/like/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await PostModel.findById(postId).populate("likes.user");

    if (!post) {
      return res.status(404).send("No Post Found");
    }

    return res.status(200).json(post.likes);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// CREATE A COMMENT
router.post("/comment/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const { userId } = req;

    if (text.length < 1)
      return res.status(401).send("Comment should be at least 1 character");

    const post = await PostModel.findById(postId);

    if (!post) return res.status(404).send("Post not found");

    const newComment = {
      _id: uuid(),
      text,
      user: userId,
      date: Date.now(),
    };

    await post.comments.unshift(newComment);
    await post.save();

    if (post.user.toString() !== userId) {
      await newCommentNotification(
        postId,
        newComment._id,
        userId,
        post.user.toString(),
        text
      );
    }

    return res.status(200).json(newComment._id);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// DELETE A COMMENT
router.delete("/:postId/:commentId", authMiddleware, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req;

    const post = await PostModel.findById(postId);
    if (!post) return res.status(404).send("Post not found");

    const comment = post.comments.find((comment) => comment._id === commentId);

    if (!comment) {
      return res.status(404).send("No Comment found");
    }

    const user = await UserModel.findById(userId);

    const deleteComment = async () => {
      const indexOf = post.comments
        .map((comment) => comment._id)
        .indexOf(commentId);

      await post.comments.splice(indexOf, 1);

      await post.save();

      if (post.user.toString() !== userId) {
        await removeCommentNotification(
          postId,
          commentId,
          userId,
          post.user.toString()
        );
      }

      return res.status(200).send("Deleted Successfully");
    };

    if (comment.user.toString() !== userId) {
      if (user.role === "root") {
        await deleteComment();
      } else {
        return res.status(401).send("Unauthorized");
      }
    }

    await deleteComment();
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
