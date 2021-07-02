import React, { useState, useRef } from "react";
import { Form, Segment, Button, Grid } from "semantic-ui-react";

function MessageInputField({
  sendMsg,
  uploadPic,
  setMedia,
  setMediaPreview,
  setShowModal,
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef();

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    if (name == "media") {
      setMedia(files[0]);
      setMediaPreview(URL.createObjectURL(files[0]));
      setShowModal(true);
    }
  };

  return (
    <>
      <input
        style={{ display: "none" }}
        type="file"
        accept="image/*"
        onChange={handleChange}
        name="media"
        ref={inputRef}
      />

      <div style={{ position: "sticky", bottom: "0" }}>
        <Segment secondary color="teal" attached="bottom">
          <Grid>
            <Grid.Column width={1}>
              <Button icon="image" onClick={() => inputRef.current.click()} />
            </Grid.Column>
            <Grid.Column width={15}>
              <Form
                reply
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMsg(text);
                  setText("");
                }}
              >
                <Form.Input
                  size="large"
                  placeholder="Send New Message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  action={{
                    color: "blue",
                    icon: "telegram place",
                    disabled: text === "",
                    loading: loading, // ES6 Syntax => loading
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = Array.from(e.dataTransfer.files);
                    setMedia(droppedFile[0]);
                    setMediaPreview(URL.createObjectURL(droppedFile[0]));
                    setShowModal(true);
                  }}
                />
              </Form>
            </Grid.Column>
          </Grid>
        </Segment>
      </div>
    </>
  );
}

export default MessageInputField;
