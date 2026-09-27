import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import "./style.css";

const server_url = "http://localhost:8000";
const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoref = useRef(null);
  const connectionsRef = useRef({});

  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showModal, setModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);

  // Get permissions on load
  useEffect(() => {
    getPermissions();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Ensure local video stream stays attached
  useEffect(() => {
    if (localVideoref.current && window.localStream) {
      localVideoref.current.srcObject = window.localStream;
    }
  }, [askForUsername]);

  const openChat = () => {
    setModal(true);
    setNewMessages(0);
  };

  const closeChat = () => {
    setModal(false);
  };

  const handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data, socketId: socketIdSender },
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    if (socketRef.current) {
      socketRef.current.emit("chat-message", message, username);
      setMessage("");
    }
  };

  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      window.localStream = stream;
      if (localVideoref.current) {
        localVideoref.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Media permission error:", error);
    }
  };

  const connect = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    setAskForUsername(false);
    connectToSocketServer();
  };

  const handleVideo = () => {
    if (window.localStream) {
      const videoTrack = window.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideo(videoTrack.enabled);
      }
    }
  };

  const handleAudio = () => {
    if (window.localStream) {
      const audioTrack = window.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudio(audioTrack.enabled);
      }
    }
  };

  const handleScreenShare = async () => {
    if (!screen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        Object.keys(connectionsRef.current).forEach((socketId) => {
          const pc = connectionsRef.current[socketId];
          const videoSender = pc
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (videoSender) videoSender.replaceTrack(screenTrack);
        });

        if (localVideoref.current) {
          localVideoref.current.srcObject = screenStream;
        }

        setScreen(true);
        screenTrack.onended = () => stopScreenShare();
      } catch (error) {
        console.error("Screen share error:", error);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const cameraTrack = window.localStream?.getVideoTracks()[0];
    Object.keys(connectionsRef.current).forEach((socketId) => {
      const pc = connectionsRef.current[socketId];
      const videoSender = pc
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (videoSender && cameraTrack) videoSender.replaceTrack(cameraTrack);
    });

    if (localVideoref.current && window.localStream) {
      localVideoref.current.srcObject = window.localStream;
    }
    setScreen(false);
  };

  const connectToSocketServer = () => {
    if (socketRef.current) socketRef.current.disconnect();

    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;
    });

    socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
      addMessage(data, sender, socketIdSender);
    });

    socketRef.current.on("user-left", (id) => {
      if (connectionsRef.current[id]) {
        connectionsRef.current[id].close();
        delete connectionsRef.current[id];
      }
      setVideos((prev) => prev.filter((v) => v.socketId !== id));
    });

    socketRef.current.on("user-joined", (id, clients) => {
      clients.forEach((socketListId) => {
        if (
          socketListId === socketIdRef.current ||
          connectionsRef.current[socketListId]
        )
          return;

        const pc = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[socketListId] = pc;

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit(
              "signal",
              socketListId,
              JSON.stringify({ ice: event.candidate }),
            );
          }
        };

        pc.ontrack = (event) => {
          const remoteStream = event.streams[0];
          setVideos((prev) => {
            const exists = prev.find((v) => v.socketId === socketListId);
            if (exists) {
              return prev.map((v) =>
                v.socketId === socketListId
                  ? { ...v, stream: remoteStream }
                  : v,
              );
            }
            return [...prev, { socketId: socketListId, stream: remoteStream }];
          });
        };

        if (window.localStream) {
          window.localStream.getTracks().forEach((track) => {
            pc.addTrack(track, window.localStream);
          });
        }

        // Correct WebRTC offer condition: initiate offer if you are an existing user
        if (id !== socketIdRef.current) {
          pc.createOffer().then((description) => {
            pc.setLocalDescription(description).then(() => {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ sdp: pc.localDescription }),
              );
            });
          });
        }
      });
    });
  };

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;

    const pc = connectionsRef.current[fromId];
    if (!pc) return;

    if (signal.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            pc.createAnswer().then((description) => {
              pc.setLocalDescription(description).then(() => {
                socketRef.current.emit(
                  "signal",
                  fromId,
                  JSON.stringify({ sdp: pc.localDescription }),
                );
              });
            });
          }
        })
        .catch((e) => console.error("Error setting remote description:", e));
    }

    if (signal.ice) {
      pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) =>
        console.error("Error adding ICE candidate:", e),
      );
    }
  };

  const handleEndCall = () => {
    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => track.stop());
    }
    window.location.href = "/";
  };

  return (
    <div>
      {askForUsername ? (
        <div style={{ padding: "20px" }}>
          <h2>Enter into Lobby</h2>
          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
            />
            <Button variant="contained" onClick={connect}>
              Connect
            </Button>
          </div>

          <div
            style={{
              width: "400px",
              height: "300px",
              background: "#000",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <video
              ref={localVideoref}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      ) : (
        <div className="meetVideoContainer">
          {showModal && (
            <div className="chatRoom">
              <div className="chatContainer">
                <div className="chatHeader">
                  <h2>Chat</h2>
                  <IconButton onClick={closeChat} style={{ color: "#fff" }}>
                    <CloseIcon />
                  </IconButton>
                </div>
                <div className="chattingDisplay">
                  {messages.length !== 0 ? (
                    messages.map((item, index) => (
                      <div
                        key={index}
                        className={`messageBubble ${
                          item.socketId === socketIdRef.current
                            ? "myMessage"
                            : "otherMessage"
                        }`}
                      >
                        <p className="messageSender">
                          {item.socketId === socketIdRef.current
                            ? "You"
                            : item.sender}
                        </p>
                        <p className="messageText">{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p className="noMessages">No Messages Yet</p>
                  )}
                </div>
                <div className="chattingArea">
                  <TextField
                    value={message}
                    onChange={handleMessage}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="buttonContainers">
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            <IconButton onClick={handleScreenShare} style={{ color: "white" }}>
              {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>
            <Badge badgeContent={newMessages} max={999} color="primary">
              <IconButton
                onClick={showModal ? closeChat : openChat}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video
            className="meetUserVideo"
            ref={localVideoref}
            autoPlay
            muted
            playsInline
          ></video>

          <div className="conferenceView">
            {videos.map((vid) => (
              <div key={vid.socketId}>
                <video
                  data-socket={vid.socketId}
                  ref={(ref) => {
                    if (ref && vid.stream) {
                      ref.srcObject = vid.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
