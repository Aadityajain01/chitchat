import React, { useEffect, useState, useContext } from "react";
import "./myStyle.css";
import { IconButton } from "@mui/material";
import SearchSharpIcon from "@mui/icons-material/SearchSharp";
import { useSelector } from "react-redux";
import axios from "axios";
import { Popconfirm } from "antd";
import { RefreshContext } from "../App";
import Avatar from "@mui/material/Avatar";
import Facebook from "./Skeleton";
import chat from "./Images/chat.png";

export default function Users() {
  const URL = process.env.REACT_APP_API_KEY;
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const lightTheme = useSelector((state) => state.themeKey);
  const [loading, setLoading] = useState(false);
  const { MasterRefresh, setMasterRefresh } = useContext(RefreshContext);

  // Helper function to convert buffer to image
  function bufferToImage(buffer) {
    if (!buffer || !buffer.data) return null;
    const uint8Array = new Uint8Array(buffer.data);
    const binaryString = uint8Array.reduce(
      (acc, byte) => acc + String.fromCharCode(byte),
      ""
    );
    const base64String = btoa(binaryString);
    const imageSrc = `data:${buffer.type};base64,${base64String}`;
    return imageSrc;
  }

  useEffect(() => {
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${URL}/user/fetchUsers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setLoading(false);
        const usersWithoutPasswords = response.data.map(
          ({ _id, name, email, image }) => ({
            _id,
            name: name || "Unknown", // Fallback if name is undefined
            email: email || "", // Fallback for email
            image,
          })
        );

        setUsers(usersWithoutPasswords);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [URL]);

  // Filter users based on the search term
  const filteredUsers = users.filter((user) => {
    const name = user.name ? user.name.toLowerCase() : "";
    const email = user.email ? user.email.toLowerCase() : "";

    return (
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase())
    );
  });

  const handleAccessChat = async (userId, userName) => {
    try {
      const response = await axios.post(
        `${URL}/chats/`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMasterRefresh(!MasterRefresh);
    } catch (error) {
      console.error("Chat access failed:", error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="list-container">
      <div className={`ug-header${lightTheme ? "" : " dark"}`}>
        <img
          src={chat}
          alt="Chat Icon"
          style={{ height: "2rem", width: "2rem" }}
        />
        <p className={`ug-header${lightTheme ? "" : " dark"}`}>
          Start a new Chat
        </p>
      </div>

      <div className={`ug-search${lightTheme ? "" : " dark"}`}>
        <IconButton>
          <SearchSharpIcon className={`icon${lightTheme ? "" : " dark"}`} />
        </IconButton>
        <input
          placeholder="Search"
          className={`search-box${lightTheme ? "" : " dark"}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="ug-list">
        {loading ? (
          <Facebook />
        ) : (
          filteredUsers.map((user) => (
            <Popconfirm
              key={user._id} // Key should be on Popconfirm or wrapper component
              title={user.name}
              description={`Start a new chat with ${user.name}`}
              onConfirm={() => handleAccessChat(user._id, user.name)}
              okText="Yes"
              cancelText="No"
            >
              <div
                key={user._id}
                className={`list-item${lightTheme ? "" : " dark"}`}
              >
                {user.image ? (
                  <Avatar
                    className="con-icon"
                    sx={{ width: 52, height: 52, borderRadius: 15 }}
                    src={bufferToImage(user.image)}
                    alt={user.name}
                  />
                ) : (
                  <p className="con-icon">{user.name[0]}</p>
                )}
                <p
                  className="con-title"
                  style={{ color: lightTheme ? "black" : "white" }}
                >
                  {user.name}
                </p>
              </div>
            </Popconfirm>
          ))
        )}
      </div>
    </div>
  );
}
