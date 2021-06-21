import React, { useEffect, useState } from "react";
import {
  Segment,
  TransitionablePortal,
  Icon,
  Feed,
  Progress,
} from "semantic-ui-react";
import newMsgSound from "../../utils/newMsgSound";
import { useRouter } from "next/router";
import calculateTime from "../../utils/calculateTime";

function NotificationPortal({
  newNotification,
  notificationPopup,
  showNotificationPopup,
}) {
  const router = useRouter();
  const { name, profilePicUrl, username, postId, type } = newNotification;

  const [popupVisible, setPopupVisible] = useState(notificationPopup);

  const [percent, setPercent] = useState(100);

  useEffect(() => {
    let percentage = 100;
    const interval = setInterval(() => {
      percentage = percentage - 0.1;
      // console.log(percentage);
      setPercent(percentage);
      if (percentage <= 0) {
        setPopupVisible(false);
        clearInterval(interval);
      }
    }, 1);
    return () => {
      clearInterval(interval);
      setPopupVisible(false);
    };
  }, []);

  // useEffect(() => {
  //   setTimeout(() => {
  //     const changeVisibility = () => {
  //       setPopupVisible(false);
  //     };
  //     changeVisibility();
  //   }, 8000);
  // }, []);

  return (
    <>
      <TransitionablePortal
        transition={{ animation: "fade left", duration: "500" }}
        onClose={() => notificationPopup && showNotificationPopup(false)}
        onOpen={newMsgSound}
        open={popupVisible}
      >
        <Segment
          style={{ right: "5%", position: "fixed", top: "10%", zIndex: 1000 }}
        >
          <Progress percent={percent} attached="top" color={"olive"} />
          <Icon
            name="close"
            size="large"
            style={{ float: "right", cursor: "pointer" }}
            onClick={() => showNotificationPopup(false)}
          />

          <Feed>
            <Feed.Event>
              <Feed.Label>
                <img src={profilePicUrl} />
              </Feed.Label>
              <Feed.Content>
                <Feed.Summary>
                  <Feed.User onClick={() => router.push(`/${username}`)}>
                    {name}
                  </Feed.User>{" "}
                  {type}{" "}
                  {type !== "unfollowed" && type !== "followed" ? (
                    <>
                      your{" "}
                      <a onClick={() => router.push(`/post/${postId}`)}>post</a>
                      <Feed.Date>{calculateTime(Date.now())}</Feed.Date>
                    </>
                  ) : (
                    <>
                      you &nbsp;
                      <Feed.Date>{calculateTime(Date.now())}</Feed.Date>
                    </>
                  )}
                </Feed.Summary>
              </Feed.Content>
            </Feed.Event>
          </Feed>
        </Segment>
      </TransitionablePortal>
    </>
  );
}

export default NotificationPortal;
