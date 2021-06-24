import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Grid,
  Image,
  Card,
  Icon,
  Divider,
  Header,
  Button,
  Label,
} from "semantic-ui-react";
import PostComments from "./PostComments";
import CommentInputField from "./CommentInputField";
import Link from "next/link";
import calculateTime from "../../utils/calculateTime";
import { deletePost, likePost, postUpdate } from "../../utils/postActions";
import LikesList from "./LikesList";
import uploadPic from "../../utils/uploadPicToCloudinary";

function PostModalChange({
  post,
  user,
  setLikes,
  likes,
  isLiked,
  comments,
  setComments,
}) {
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(
    post.picUrl ? post.picUrl : null
  );
  const inputRef = useRef(); // for image
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [highlighted, setHighlighted] = useState(false);

  const editPost = async () => {
    setLoading(true);
    const divTextValue = document.getElementById("contentDiv");
    // alert(divTextValue.innerHTML); // yes
    const text = divTextValue.innerHTML;
    let postPicUrl;

    if (media !== null) {
      postPicUrl = await uploadPic(media);
    }

    console.log("media >> ", media);
    console.log("postPic >> ", postPicUrl);

    if (media !== null && !postPicUrl) {
      setLoading(false);
      setErrorMsg("Error Uploading Image");
      return;
    }

    await postUpdate(post, setLoading, setErrorMsg, postPicUrl, text);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name == "media") {
      setMedia(files[0]);
      setMediaPreview(URL.createObjectURL(files[0]));
    }
  };

  const addStyles = () => ({
    textAlign: "center",
    height: "150px",
    width: "150px",
    border: "dotted",
    paddingTop: media === null && "60px",
    cursor: "pointer",
    borderColor: highlighted ? "green" : "black",
  });

  const DeletePreview = () => {
    setMedia(null);
    setMediaPreview(null);
  };

  return (
    <>
      <Header as="h3" textAlign="right">
        {loading && (
          <Icon
            loading={loading}
            name="spinner"
            style={{ position: "absolute" }}
            color="red"
          />
        )}
        {errorMsg}
        <Button
          color="blue"
          icon="save"
          content="Save"
          onClick={editPost}
          style={{ marginLeft: "100px" }}
        />
      </Header>
      <Divider />

      <Grid columns={2} stackable relaxed>
        <Grid.Column>
          <Modal.Content image>
            {mediaPreview ? (
              <Image
                wrapped
                size="large"
                src={mediaPreview}
                onClick={() => inputRef.current.click()}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <div
                onClick={() => inputRef.current.click()}
                style={addStyles()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHighlighted(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setHighlighted(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setHighlighted(true);
                  const droppedFile = Array.from(e.dataTransfer.files);
                  setMedia(droppedFile[0]);
                  setMediaPreview(URL.createObjectURL(droppedFile[0]));
                }}
              >
                {mediaPreview === null ? (
                  <Icon name="plus" size="big" />
                ) : (
                  <>
                    <Image
                      style={{ height: "100px", width: "150px" }}
                      src={mediaPreview}
                      alt="PostImage"
                      centered
                      size="medium"
                    />
                  </>
                )}
              </div>
            )}
          </Modal.Content>
          {mediaPreview && (
            <>
              <Divider hidden />
              <Label style={{ cursor: "pointer" }} onClick={DeletePreview}>
                <Icon
                  name="delete"
                  size="big"
                  style={{ marginRight: "10px" }}
                />
                Delete Image
              </Label>
            </>
          )}
        </Grid.Column>
        <Grid.Column>
          <Card fluid>
            <Card.Content>
              <Image floated="left" avatar src={post.user.profilePicUrl} />

              <Card.Header>
                <Link href={`/${post.user.username}`}>
                  <a>{post.user.name}</a>
                </Link>
              </Card.Header>
              <Card.Meta>{calculateTime(post.createdAt)}</Card.Meta>
              {post.location && <Card.Meta content={post.location} />}
              <Card.Description
                style={{
                  fontSize: "17px",
                  letterSpacing: "0.1px",
                  wordSpacing: "0.35px",
                }}
              >
                <div id="contentDiv" contentEditable>
                  {post.text}
                </div>
              </Card.Description>
            </Card.Content>
          </Card>
        </Grid.Column>
      </Grid>
      <input
        style={{ display: "none" }}
        type="file"
        accept="image/*"
        onChange={handleChange}
        name="media"
        ref={inputRef}
      />
    </>
  );
}

export default PostModalChange;
