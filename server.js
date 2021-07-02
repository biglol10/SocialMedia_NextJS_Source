const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
require("dotenv").config({ path: "./config.env" });
const connectDb = require("./utilsServer/connectDb");
connectDb();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const {
  addUser,
  removeUser,
  findConnectedUser,
} = require("./utilsServer/roomActions");
const {
  loadMessages,
  sendMsg,
  setMsgToUnread,
  deleteMsg,
} = require("./utilsServer/messageActions");

const {
  likeOrUnlikePost,
  findUserPost,
} = require("./utilsServer/likeOrUnlikePost");

// first parameter is event (string), 'connection' is a default event from socket.io, you should not use it yourself
// this event is triggered by socket.current = io(baseUrl) in messages.js, when the socket makes initial connection
// socket parameter is basically the client who is connected
io.on("connection", (socket) => {
  // // inside this function we are going to have all the events and we are going to send data inside this function

  // socket.on("helloWorld", ({ name, age }) => {
  //   console.log({ name, age });

  //   socket.emit("dataReceived", { msg: `Hello ${name}, data received` });
  // });

  socket.on("join", async ({ userId }) => {
    // the first event we are emitting from client
    const users = await addUser(userId, socket.id); // socket.id => The unique ID for this Socket. Regenerated at every connection

    console.log(`Users in socketio `, users);

    setInterval(() => {
      socket.emit("connectedUsers", {
        users: users.filter((user) => user.userId !== userId),
      });
    }, 10000);
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    console.log(`User disconnected socketid = ${socket.id}`);
  });

  socket.on("loadMessages", async ({ userId, messagesWith }) => {
    const { chat, error } = await loadMessages(userId, messagesWith);

    if (!error) {
      socket.emit("messagesLoaded", { chat });
    } else {
      socket.emit("noChatFound");
    }
  });

  socket.on("sendNewMsg", async ({ userId, msgSendToUserId, msg, picUrl }) => {
    const { newMsg, error } = await sendMsg(
      userId,
      msgSendToUserId,
      msg,
      picUrl
    );
    const receiverSocket = findConnectedUser(msgSendToUserId); // this is the socket whom we want to send the message

    // user is online, if he is there
    if (receiverSocket) {
      // when you want to send message to a particular socket
      // console.log("receiverSocket");
      io.to(receiverSocket.socketId).emit("newMsgReceived", { newMsg }); // send msg alert to specific person
    } else {
      // console.log("not receiverSocket");
      await setMsgToUnread(msgSendToUserId); // so should know that there was a message sent to him and he has not read, so he has to open messages page
    }

    if (!error) {
      socket.emit("msgSent", { newMsg }); // this socket.emit is basically for the sender, the user who has made the request
    }
  });

  socket.on("deleteMsg", async ({ userId, messagesWith, messageId }) => {
    const { success } = await deleteMsg(userId, messagesWith, messageId);
    if (success) {
      socket.emit("msgDeleted");
    }
  });

  socket.on(
    "sendMsgFromNotification",
    async ({ userId, msgSendToUserId, msg }) => {
      const { newMsg, error } = await sendMsg(userId, msgSendToUserId, msg);
      const receiverSocket = findConnectedUser(msgSendToUserId);

      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit("newMsgReceived", { newMsg });
      } else {
        await setMsgToUnread(msgSendToUserId);
      }

      !error && socket.emit("msgSentFromNotification");
    }
  );

  socket.on("likePost", async ({ postId, userId, like }) => {
    const { success, name, profilePicUrl, username, postByUserId, error } =
      await likeOrUnlikePost(postId, userId, like);

    if (success) {
      socket.emit("postLiked");

      if (postByUserId !== userId) {
        // check if the user is online only then give real time notification
        const receiverSocket = findConnectedUser(postByUserId);

        // user is online and emit notification only when you like the post
        if (receiverSocket && like) {
          // WHEN YOU WANT TO SEND DATA TO ONE PARTICULAR CLIENT
          io.to(receiverSocket.socketId).emit("newNotificationReceived", {
            name,
            profilePicUrl,
            username,
            postId,
            type: "liked",
          });
        }
      }
    }
  });

  socket.on("commentedOn", async ({ postId, user, text }) => {
    const { postUser } = await findUserPost(postId);

    const receiverSocket = findConnectedUser(postUser);

    const { name, profilePicUrl, username } = user;

    if (receiverSocket) {
      io.to(receiverSocket.socketId).emit("newNotificationReceived", {
        name,
        profilePicUrl,
        username,
        postId,
        type: "commented on",
      });
    }
  });

  socket.on(
    "userFollowUnfollow",
    async ({ userId, toSetuserFollowStats, fromUser, type }) => {
      const receiverSocket = findConnectedUser(userId);
      const { name, profilePicUrl, username } = fromUser;
      if (receiverSocket) {
        console.log("receiverSocket is > ", receiverSocket.socketId);
        io.to(receiverSocket.socketId).emit("newNotificationReceived", {
          name,
          profilePicUrl,
          username,
          postId: "",
          type,
        });
      }
    }
  );
});

nextApp.prepare().then(() => {
  app.use("/api/signup", require("./api/signup"));
  app.use("/api/auth", require("./api/auth"));
  app.use("/api/search", require("./api/search"));
  app.use("/api/posts", require("./api/posts"));
  app.use("/api/profile", require("./api/profile"));
  app.use("/api/notifications", require("./api/notifications"));
  app.use("/api/chats", require("./api/chats"));
  app.use("/api/reset", require("./api/reset"));

  app.all("*", (req, res) => handle(req, res));

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log("Express server running");
  });
});
