const messagesLoaded = ({ setMessages, setBannerData, openChatId }) => {
  // console.log(chat);
  setMessages(chat.messages);
  setBannerData({
    name: chat.messagesWith.name,
    profilePicUrl: chat.messagesWith.profilePicUrl,
  }); // openChatId changes only when messagesLoaded event is loaded
  openChatId.current = chat.messagesWith._id; // to keep track of queryString inside the url with this ref, this value will persist through re-renders of the component

  divRef.current && scrollDivToBottom(divRef);
};
