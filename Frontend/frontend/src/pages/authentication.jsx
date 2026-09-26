import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Snackbar from "@mui/material/Snackbar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const defaultTheme = createTheme();

export default function Authentication() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessages] = useState("");

  const [formState, setFormState] = useState(0);
  // formstate is 0 for login and is 1 for register
  const [open, setOpen] = useState(false);

  const { handleRegister, handleLogin } = useContext(AuthContext);

  let handleAuth = async () => {
    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
        setMessages(result);
        setOpen(true);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        console.log(result);
        setMessages(result);
        setOpen(true);
      }
    } catch (err) {
      let message =
        err?.response?.data?.message || "An unexpected error occurred";
      setError(message);
    }
  };
  return (
    <ThemeProvider theme={defaultTheme}>
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        <CssBaseline />

        {/* Left Side: Background Image */}
        <Box
          sx={{
            flex: { xs: 0, sm: 6, md: 7 },
            display: { xs: "none", sm: "block" },
            backgroundImage: "url(https://picsum.photos/1600/900)",
            backgroundRepeat: "no-repeat",
            backgroundColor: (t) =>
              t.palette.mode === "light"
                ? t.palette.grey[50]
                : t.palette.grey[900],
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Right Side: Sign-in Form */}
        <Box
          component={Paper}
          elevation={6}
          square
          sx={{
            flex: { xs: 12, sm: 6, md: 5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <div>
            <Button
              variant={formState === 0 ? "contained" : ""}
              onClick={() => {
                setFormState(0);
              }}
            >
              Sign In
            </Button>
            <Button
              variant={formState === 1 ? "contained" : ""}
              onClick={() => {
                setFormState(1);
              }}
            >
              Sign Up
            </Button>
          </div>
          <Box
            component="form"
            noValidate
            sx={{ mt: 1, width: "100%", maxWidth: "400px" }}
          >
            <p>{name}</p>
            {formState === 1 ? (
              <TextField
                margin="normal"
                required
                fullWidth
                name="Full Name"
                label="Full Name"
                type="Full Name"
                id="Full Name"
                autoFocus
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <></>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <p style={{ color: "red" }}>{error}</p>
            <Button
              type="button"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleAuth}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        message={message}
      />
    </ThemeProvider>
  );
}
