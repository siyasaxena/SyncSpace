import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import { IconButton, Container, Box } from "@mui/material";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();

        // Ensure history is an array (handles cases where backend wraps response in data/meetings)
        if (Array.isArray(history)) {
          setMeetings(history);
        } else if (history?.data && Array.isArray(history.data)) {
          setMeetings(history.data);
        } else if (history?.meetings && Array.isArray(history.meetings)) {
          setMeetings(history.meetings);
        } else {
          setMeetings([]);
        }
      } catch (error) {
        console.error("Error fetching user history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton
          onClick={() => {
            routeTo("/home");
          }}
          color="primary"
        >
          <HomeIcon />
        </IconButton>
        <Typography variant="h5" sx={{ ml: 1 }}>
          Meeting History
        </Typography>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading meetings...</Typography>
      ) : meetings && meetings.length > 0 ? (
        meetings.map((e, i) => (
          <Card key={e._id || i} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography
                sx={{ fontSize: 16, fontWeight: "bold" }}
                color="primary"
                gutterBottom
              >
                Code: {e.meetingCode || e.meeting_id || "N/A"}
              </Typography>

              <Typography sx={{ mb: 0.5 }} color="text.secondary">
                Date: {formatDate(e.date || e.createdAt)}
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography color="text.secondary">No past meetings found.</Typography>
      )}
    </Container>
  );
}
