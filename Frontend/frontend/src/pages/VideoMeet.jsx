import { useState, useEffect, useRef } from "react";
import { TextField, Button } from "@mui/material";
import "./style.css";

const server_url = "https://localhost:8000";
const connections = {};
const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState(true);
  let [audio, setAudio] = useState(true);
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(true);
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(3);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);

  const getPermissions = async () => {
    try {
      // Check screen sharing availability
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      // Request user media once for both audio and video
      const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (userMediaStream) {
        setVideoAvailable(true);
        setAudioAvailable(true);
        window.localStream = userMediaStream; //global variable window.localStream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMediaStream;
        }
      }
    } catch (e) {
      console.error("Error accessing media devices:", e);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(() => {}) // todo- getUserMediaSuccess
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {
        console.log(e);
      }
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);

    //connectToSocketServer();
  };
  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            variant="outlined"
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained">Connect</Button>

          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : null}
    </div>
  );
}
