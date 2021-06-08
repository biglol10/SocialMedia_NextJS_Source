import React, { useState } from "react";
import { Icon, Popup } from "semantic-ui-react";
import calculateTime from "../../utils/calculateTime";

function Message({
  message,
  user,
  // setMessages,
  // messagesWith,
  deleteMsg,
  bannerProfilePic,
  divRef,
}) {
  const [deleteIcon, showDeleteIcon] = useState(false);

  const ifYouSender = message.sender === user._id;

  return (
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
          {message.msg}
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
  );
}

export default Message;
