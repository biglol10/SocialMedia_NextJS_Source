const ChatModel = require("../models/ChatModel");
const UserModel = require("../models/UserModel");

const loadMessages = async (userId, messagesWith) => {
  try {
    const user = await ChatModel.findOne({ user: userId }).populate(
      "chats.messagesWith"
    );

    const chat = user.chats.find(
      (chat) => chat.messagesWith._id.toString() === messagesWith
    );

    if (!chat) {
      return { error: "No chat found" };
    }

    return { chat };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const sendMsg = async (userId, msgSendToUserId, msg, picUrl) => {
  try {
    // LOGGED IN USER (SENDER)
    const user = await ChatModel.findOne({ user: userId });

    // RECEIVER
    const msgSendToUser = await ChatModel.findOne({ user: msgSendToUserId });

    const newMsg = {
      sender: userId,
      receiver: msgSendToUserId,
      msg,
      picUrl,
      date: Date.now(),
    };

    const previousChat = user.chats.find(
      (chat) => chat.messagesWith.toString() === msgSendToUserId // Since we are not populating the data we need to add toString
    );

    if (previousChat) {
      previousChat.messages.push(newMsg);
      await user.save();
    }
    // no previous chat
    else {
      const newChat = { messagesWith: msgSendToUserId, messages: [newMsg] };
      user.chats.unshift(newChat); // unshift adds element to the start of the array
      await user.save();
    }

    const previousChatForReceiver = msgSendToUser.chats.find(
      (chat) => chat.messagesWith.toString() === userId
    );

    if (previousChatForReceiver) {
      previousChatForReceiver.messages.push(newMsg);
      await msgSendToUser.save();
    }
    // no previous chat
    else {
      const newChat = { messagesWith: userId, messages: [newMsg] };
      msgSendToUser.chats.unshift(newChat);
      await msgSendToUser.save();
    }

    return { newMsg };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const setMsgToUnread = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user.unreadMessage) {
      user.unreadMessage = true;
      await user.save();
    }
    return;
  } catch (error) {
    console.error(error);
  }
};

const deleteMsg = async (userId, messagesWith, messageId) => {
  try {
    const user = await ChatModel.findOne({ user: userId });

    const chat = user.chats.find(
      (chat) => chat.messagesWith.toString() === messagesWith
    );

    if (!chat) {
      return;
    }

    const messageToDelete = chat.messages.find(
      (message) => message._id.toString() === messageId
    );

    if (!messageToDelete) return;

    if (messageToDelete.sender.toString() !== userId) {
      // you are not the message owner
      return;
    }

    const indexOf = chat.messages
      .map((message) => message._id.toString())
      .indexOf(messageToDelete._id.toString());

    await chat.messages.splice(indexOf, 1);
    await user.save();

    return { success: true };
  } catch (error) {
    console.log(error);
  }
};

module.exports = { loadMessages, sendMsg, setMsgToUnread, deleteMsg };
