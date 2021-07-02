import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import baseUrl from "../utils/baseUrl";
import { parseCookies } from "nookies";
import {
  Segment,
  Divider,
  Header,
  Comment,
  Grid,
  Icon,
  Modal,
  Image,
  Button,
} from "semantic-ui-react";
import Chat from "../components/Chats/Chat";
import ChatListSearch from "../components/Chats/ChatListSearch";
import { useRouter } from "next/router";
import { NoMessages } from "../components/Layout/NoData";
import Banner from "../components/Messages/Banner";
import Message from "../components/Messages/Message";
import MessageInputField from "../components/Messages/MessageInputField";
import getUserInfo from "../utils/getUserInfo";
import newMsgSound from "../utils/newMsgSound";
import Cookies from "js-cookie";
import cookie from "js-cookie";

import uploadPic from "../utils/uploadPicToCloudinary";

const scrollDivToBottom = (divRev) => {
  divRev.current !== null &&
    divRev.current.scrollIntoView({ behaviour: "smooth" });
};

function Messages({ chatsData, user }) {
  const [chats, setChats] = useState(chatsData);
  const router = useRouter();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const socket = useRef();

  const [messages, setMessages] = useState([]);
  const [bannerData, setBannerData] = useState({ name: "", profilePicUrl: "" });
  const [messagesWithState, setMessagesWithState] = useState();
  // This ref is for persisting the state of query string in url throughout re-renders. This ref is the query string inside url
  const openChatId = useRef("");

  // https://react.vlpt.us/basic/10-useRef.html, https://react.vlpt.us/basic/12-variable-with-useRef.html
  //   useRef는 일반적인 자바스크립트 객체입니다 즉 heap 영역에 저장됩니다
  // 그래서 어플리케이션이 종료되거나 가비지 컬렉팅 될 때 까지 참조할 때 마다 같은 메모리 주소를 가지게 되고
  // 같은 메모리 주소를 가지기 때문에 === 연산이 항상 true를 반환하고, 값이 바뀌어도 리렌더링 되지 않습니다.

  // 하지만 함수 컴포넌트 내부에 변수를 선언한다면, 렌더링 될 때마다 값이 초기화 됩니다.
  // 그래서 해당 방법을 지양하는 것 같습니다 :)

  const divRef = useRef();

  // start: for image upload
  const [showModal, setShowModal] = useState(false);
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [imgUploadLoading, setImgUploadLoading] = useState(false);

  const messageImgUpload = async () => {
    setImgUploadLoading(true);
    let picUrl;
    if (media !== null) {
      picUrl = await uploadPic(media);
      if (picUrl) {
        sendMsg("", picUrl);
      }
    }
    setImgUploadLoading(false);
    setShowModal(false);
  };
  // end: for image upload

  // CONNECTION USEEFFECT
  useEffect(() => {
    if (!socket.current) {
      socket.current = io(baseUrl); // connecting to server by calling io with baseUrl
    }

    if (socket.current) {
      //   // if it is connected
      //   // first argument is an event that you can name anything
      //   // emit helloWorld event and send object(name,age) to the server
      //   socket.current.emit("helloWorld", { name: "Biglol", age: "22" });

      //   socket.current.on("dataReceived", ({ msg }) => {  // dataReceived in server.js
      //     console.log(msg);
      //   });
      socket.current.emit("join", { userId: user._id });

      socket.current.on("connectedUsers", ({ users }) => {
        users.length > 0 && setConnectedUsers(users);
      });

      if (chats.length > 0 && !router.query.message) {
        router.push(`/messages?message=${chats[0].messagesWith}`, undefined, {
          shallow: true,
        });
      }
    }

    // https://www.udemy.com/course/mernstack-nextjs-withsocketio/learn/lecture/26146084#questions/14415934
    return () => {
      console.log(socket.current);
      if (socket.current) {
        socket.current.emit("disconnect");
        socket.current.off();
      }
    };
  }, []);

  // LOAD MESSAGES USEEFFECT
  useEffect(() => {
    // this useEffect should be below
    const loadMessages = () => {
      socket.current.emit("loadMessages", {
        userId: user._id,
        messagesWith: router.query.message,
      });
      socket.current.on("messagesLoaded", ({ chat }) => {
        // console.log(chat);
        setMessages(chat.messages);
        setMessagesWithState(chat.messagesWith);
        setBannerData({
          name: chat.messagesWith.name,
          profilePicUrl: chat.messagesWith.profilePicUrl,
        }); // openChatId changes only when messagesLoaded event is loaded
        openChatId.current = chat.messagesWith._id; // to keep track of queryString inside the url with this ref, this value will persist through re-renders of the component

        divRef.current && scrollDivToBottom(divRef);
      });
      socket.current.on("noChatFound", async () => {
        const { name, profilePicUrl } = await getUserInfo(router.query.message); // not used openChatId.current because it changes only when messagesLoaded event is triggered
        setBannerData({ name, profilePicUrl });
        setMessages([]);
        openChatId.current = router.query.message; // set the value to query.message in this case because we didn't get any chat from backend
        // So, we set it to query string in url and its value will be saved throughout re-renders
      });
    };

    if (socket.current && router.query.message) {
      loadMessages();
    }
  }, [router.query.message]);

  const sendMsg = (msg, picUrl = "") => {
    if (socket.current) {
      socket.current.emit("sendNewMsg", {
        userId: user._id,
        msgSendToUserId: openChatId.current,
        msg: picUrl ? "[picture]" : msg,
        picUrl,
      });
    }
  };

  // CONFIRMING MSG IS SENT AND RECEIVING THE MESSAGES
  useEffect(() => {
    if (socket.current) {
      socket.current.on("msgSent", ({ newMsg }) => {
        if (newMsg.receiver === openChatId.current) {
          // the user to whom you send the message, we have that chat opened. You don't want to add messages to another chat
          setMessages((prev) => [...prev, newMsg]);
          setChats((prev) => {
            const previousChat = prev.find(
              (chat) => chat.messagesWith === newMsg.receiver
            );
            previousChat.lastMessage = newMsg.msg;
            previousChat.date = newMsg.date;
            return [...prev];
          });
        }
      });
      socket.current.on("newMsgReceived", async ({ newMsg }) => {
        let senderName;

        // whan chat is opened inside your browser
        if (newMsg.sender === openChatId.current) {
          // if the user who has sent a new message and that chat is opened inside your browser
          setMessages((prev) => [...prev, newMsg]);

          setChats((prev) => {
            const previousChat = prev.find(
              (chat) => chat.messagesWith === newMsg.sender
            );
            previousChat.lastMessage = newMsg.msg;
            previousChat.date = newMsg.date;

            senderName = previousChat.name;

            return [...prev];
          });
        } else {
          // there is a chat previously with the sender (left side of column active)
          const ifPreviouslyMessaged =
            chats.filter((chat) => chat.messagesWith === newMsg.sender).length >
            0;

          if (ifPreviouslyMessaged) {
            setChats((prev) => {
              const previousChat = prev.find(
                (chat) => chat.messagesWith === newMsg.sender
              );
              previousChat.lastMessage = newMsg.msg;
              previousChat.date = newMsg.date;

              senderName = previousChat.name;

              return [
                previousChat,
                ...prev.filter((chat) => chat.messagesWith !== newMsg.sender),
              ];
            });
          }
          // if you don't have any previousChat with the user
          else {
            const { name, profilePicUrl } = await getUserInfo(newMsg.sender);
            senderName = name; // receiving from backend
            const newChat = {
              messagesWith: newMsg.sender,
              name,
              profilePicUrl,
              lastMessage: newMsg.msg,
              date: newMsg.date,
            };
            setChats((prev) => [newChat, ...prev]);
          }
        }

        newMsgSound(senderName);
      });
    }
  }, []);

  useEffect(() => {
    messages.length > 0 && scrollDivToBottom(divRef);
  }, [messages]);

  const deleteMsg = (messageId) => {
    if (socket.current) {
      socket.current.emit("deleteMsg", {
        userId: user._id,
        messagesWith: openChatId.current,
        messageId,
      });

      socket.current.on("msgDeleted", () => {
        setMessages((prev) =>
          prev.filter((message) => message._id !== messageId)
        );
      });
    }
  };

  const deleteChat = async (messagesWith) => {
    try {
      await axios.delete(`${baseUrl}/api/chats/${messagesWith}`, {
        // another way: using axios
        headers: { Authorization: Cookies.get("token") },
      });

      setChats((prev) =>
        prev.filter((chat) => chat.messagesWith !== messagesWith)
      );

      router.push("/messages", undefined, { shallow: true });
    } catch (error) {
      alert(`Error deleting chat`);
    }
  };

  return (
    <>
      {/* Modal for Image Upload */}
      <Modal
        open={showModal}
        closeIcon
        closeOnDimmerClick
        onClose={() => setShowModal(false)}
        size="mini"
      >
        <Header icon="picture" content="Upload Image" />
        <Modal.Content>
          <Image src={mediaPreview} size="big" />
        </Modal.Content>
        <Modal.Actions>
          <Button inverted color="red" onClick={() => setShowModal(false)}>
            <Icon name="remove" /> Cancel
          </Button>
          <Button
            disabled={imgUploadLoading}
            inverted
            color="violet"
            onClick={messageImgUpload}
          >
            {imgUploadLoading ? (
              <Icon name="spinner" loading />
            ) : (
              <Icon name="checkmark" />
            )}
            Upload
          </Button>
        </Modal.Actions>
      </Modal>

      <Segment padded basic size="large" style={{ marginTop: "5px" }}>
        <Header
          icon="home"
          content="Go Back!"
          onClick={() => router.push("/")}
          style={{ cursor: "pointer" }}
        />
        <Divider hidden />
        <div style={{ marginBottom: "10px" }}>
          <ChatListSearch chats={chats} setChats={setChats} />
        </div>

        {chats.length > 0 ? (
          <>
            <>
              <Grid stackable>
                <Grid.Column width={4}>
                  <Comment.Group size="big">
                    <Segment
                      raised
                      style={{ overflow: "auto", maxHeight: "32rem" }}
                    >
                      {chats.map((chat, i) => (
                        <Chat
                          key={i}
                          connectedUsers={connectedUsers}
                          chat={chat}
                          deleteChat={deleteChat}
                        />
                      ))}
                    </Segment>
                  </Comment.Group>
                </Grid.Column>

                <Grid.Column width={12}>
                  {router.query.message && (
                    <>
                      <div
                        style={{
                          overflow: "auto",
                          overflowX: "hidden",
                          maxHeight: "35rem",
                          height: "35rem",
                          backgroundColor: "whitesmoke",
                        }}
                      >
                        <>
                          <div style={{ position: "sticky", top: "0" }}>
                            <Banner bannerData={bannerData} />
                          </div>
                          {messages.length > 0 && (
                            <>
                              {messages.map((message, i) => (
                                <Message
                                  key={i}
                                  divRef={divRef}
                                  bannerProfilePic={bannerData.profilePicUrl}
                                  message={message}
                                  user={user}
                                  deleteMsg={deleteMsg}
                                  messagesWithState={messagesWithState}
                                  // setMessages={setMessages}
                                  // messagesWith={openChatId.current} // not using router.query.messages because when the component re-renders the value resets automatically
                                />
                              ))}
                            </>
                          )}
                        </>
                      </div>
                      <MessageInputField
                        sendMsg={sendMsg}
                        uploadPic={uploadPic}
                        setMedia={setMedia}
                        setMediaPreview={setMediaPreview}
                        setShowModal={setShowModal}
                      />
                    </>
                  )}
                </Grid.Column>
              </Grid>
            </>
          </>
        ) : (
          <NoMessages />
        )}
      </Segment>
    </>
  );
}

Messages.getInitialProps = async (ctx) => {
  try {
    const { token } = parseCookies(ctx);

    const res = await axios.get(`${baseUrl}/api/chats`, {
      headers: { Authorization: token },
    });

    return { chatsData: res.data };
  } catch (error) {
    return { errorLoading: true };
  }
};

export default Messages;
