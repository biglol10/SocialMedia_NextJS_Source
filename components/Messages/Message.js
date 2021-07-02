import React, { useState } from "react";
import { Icon, Popup, Image, Modal, Header } from "semantic-ui-react";
import calculateTime from "../../utils/calculateTime";

function Message({
  message,
  user,
  // setMessages,
  // messagesWith,
  deleteMsg,
  bannerProfilePic,
  divRef,
  messagesWithState,
}) {
  const [deleteIcon, showDeleteIcon] = useState(false);

  const ifYouSender = message.sender === user._id;

  const [showModalImageEnlarge, setShowModalImageEnlarge] = useState(false);
  const [mediaEnlargePreview, setMediaEnlargePreview] = useState(null);

  const showLargeImage = (picUrl) => {
    setShowModalImageEnlarge(true);
    setMediaEnlargePreview(picUrl);
  };

  const jsDate = new Date(message.date);
  const msgImgTime = `${jsDate.getFullYear()}/${jsDate.getMonth()}/${jsDate.getDate()} - ${jsDate.getHours()}:${jsDate.getMinutes()}`;

  return (
    <>
      {/* Modal for viewing image */}
      <Modal
        open={showModalImageEnlarge}
        closeIcon
        closeOnDimmerClick
        onClose={() => setShowModalImageEnlarge(false)}
        size="tiny"
      >
        <Header icon="picture">
          {ifYouSender
            ? `[My Image]: ${msgImgTime}`
            : `[${messagesWithState?.name}]: ${msgImgTime}`}
        </Header>
        <Modal.Content>
          <Image src={mediaEnlargePreview} size="big" />
        </Modal.Content>
      </Modal>
      <div className="bubbleWrapper" ref={divRef}>
        <div
          className={ifYouSender ? "inlineContainer own" : "inlineContainer"}
          onClick={() => ifYouSender && showDeleteIcon(!deleteIcon)}
        >
          <img
            src={ifYouSender ? user.profilePicUrl : bannerProfilePic}
            alt=""
            className="inlineIcon"
          />
          <div className={ifYouSender ? "ownBubble" : "otherBubble other"}>
            {message.picUrl ? (
              <img
                src={message.picUrl}
                style={{ height: "70px", width: "70px", cursor: "pointer" }}
                onClick={() => showLargeImage(message.picUrl)}
              />
            ) : (
              message.msg
            )}
          </div>

          {deleteIcon && (
            <Popup
              trigger={
                <Icon
                  name="trash"
                  color="red"
                  style={{ cursor: "pointer" }}
                  onClick={() => deleteMsg(message._id)}
                />
              }
              content="This will only delete the message from your inbox!"
              position="top right"
            />
          )}
        </div>
        <span className={ifYouSender ? "own" : "other"}>
          {calculateTime(message.date)}
        </span>
      </div>
    </>
  );
}

export default Message;
