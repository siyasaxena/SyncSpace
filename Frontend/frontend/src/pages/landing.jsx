import React from "react";
import "./style.css";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <>
      <div className="LandingPagecontainer">
        <nav>
          <div className="navHeader">
            <h2>Apna Video Call</h2>
          </div>
          <div className="navList">
            <p>Join as Guest</p>
            <p>Register</p>
            <div>
              <p>Login</p>
            </div>
          </div>
        </nav>
        <div className="landingMainContainer">
          <div>
            <h1>
              <span style={{ color: "#FF9839" }}>Connect</span> with your loved
              Ones
            </h1>

            <p>Cover a distance by Apna Video Call</p>

            <div role="button">
              <Link to={"/home"}>Get Started</Link>
            </div>
          </div>
          <div>
            <img src="/66ab64a01f9d406a849b74a8_video_api_hero.webp" alt="" />
          </div>
        </div>
      </div>
    </>
  );
}
