const newMsgSound = (senderName) => {
  const sound = new Audio("/light.mp3");

  sound && sound.play();
  if (senderName) {
    document.title = `New message from ${senderName}`;

    if (document.visibilityState === "visible") {
      // if the user is not in other tab
      setTimeout(() => {
        document.title = "Messages";
      }, 5000);
    }
  }
};

export default newMsgSound;
