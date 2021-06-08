import React, { useState, useEffect } from "react";
import { List, Image, Search } from "semantic-ui-react";
import axios from "axios";
import cookie from "js-cookie";
import Router from "next/router";
import baseUrl from "../../utils/baseUrl";
import { useRouter } from "next/router";

let cancel;

function ChatListSearch({ chats, setChats }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const router = useRouter();

  const handleChange = async (e) => {
    const { value } = e.target;
    if (value.length === 0) return setText(value);
    if (value.trim().length === 0) return;
    setText(value);
    setLoading(true);

    try {
      cancel && cancel();
      const CancelToken = axios.CancelToken;
      const token = cookie.get("token");
      const res = await axios.get(`${baseUrl}/api/search/${value}`, {
        headers: { Authorization: token },
        cancelToken: new CancelToken((canceler) => {
          cancel = canceler;
        }),
      });

      if (res.data.length === 0) {
        results.length > 0 && setResults([]);
        return setLoading(false);
      }

      setResults(res.data);
    } catch (error) {
      console.log("Error searching", error);
    }
    setLoading(false);
  };

  const addChat = (result) => {
    const alreadyInChat =
      chats.length > 0 &&
      chats.filter((chat) => chat.messagesWith === result._id).length > 0;
    if (alreadyInChat) {
      return router.push(`/messages?message=${result._id}`);
    } else {
      const newChat = {
        messagesWith: result._id,
        name: result.name,
        profilePicUrl: result.profilePicUrl,
        lastMessage: "",
        date: Date.now(),
      };
      setChats((prev) => [newChat, ...prev]);
      return router.push(`/messages?message=${result._id}`);
    }
  };

  return (
    <Search
      onBlur={() => {
        results.length > 0 && setResults([]);
        loading && setLoading(false);
        setText("");
      }}
      loading={loading}
      value={text}
      resultRenderer={ResultRenderer}
      results={results}
      onSearchChange={handleChange}
      minCharacters={1}
      onResultSelect={(e, data) => {
        addChat(data.result);
      }}
    />
  );
}

const ResultRenderer = (props) => {
  console.log(props);
  const { _id, profilePicUrl, name } = props;
  return (
    <List key={_id}>
      <List.Item>
        <Image src={profilePicUrl} alt="ProfilePic" avatar />
        <List.Content header={name} as="a" />
      </List.Item>
    </List>
  );
};

export default ChatListSearch;
