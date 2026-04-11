import React from "react";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const navigate = useNavigate();

  const goToRegister = () => {
    navigate("/register");
  };

  const goToLogin = () => {
    navigate("/login");
  };

  const goToAbout = () => {
    navigate("/about");
  };

  return (
    <footer className="footer">
      <div className="footer-left">
        <div className="footer-logo">
          <div className="footer-circle">❤</div>
          <span>Pavia</span>
        </div>
        <p>
          A compatibility-based adoption platform focused on meaningful matches.
        </p>
      </div>

      <div className="footer-right">
        <button onClick={goToAbout}>About Us</button>
        <button onClick={goToRegister}>Register</button>
        <button onClick={goToLogin}>Log In</button>
      </div>
    </footer>
  );
}

export default Footer;