import React, { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackSharp } from 'react-icons/io5';
import { BiLogOut } from "react-icons/bi";
import userConversation from '../../Zustand/UseConversation';
import { useSocketContext } from '../../context/SocketContext';

const Sidebar = ({ onSelectUser }) => {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [searchUser, setSearchUser] = useState([]);
  const [chatUser, setChatUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // State for unread messages map: { senderId: count }
  const [unreadMessages, setUnreadMessages] = useState({});
  
  // Custom Logout Modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutConfirmInput, setLogoutConfirmInput] = useState("");
  
  const { messages, selectedConversation, setSelectedConversation } = userConversation();
  const { onlineUser, socket } = useSocketContext();

  // Socket listener for new messages to update unread counts and sidebar order
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // 1. Handle unread badge
      if (!selectedConversation || selectedConversation._id !== newMessage.senderId) {
        setUnreadMessages(prev => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
        }));
      }

      // 2. Update last message preview and bubble user to top
      setChatUser(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          if (user._id === newMessage.senderId) {
            return {
              ...user,
              lastMessage: {
                message: newMessage.message,
                senderId: newMessage.senderId,
                createdAt: newMessage.createdAt
              }
            };
          }
          return user;
        });

        // Sort: most recent active message first
        return [...updatedUsers].sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
          return dateB - dateA;
        });
      });
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedConversation]);

  // Update own last message in sidebar when current user sends a message
  useEffect(() => {
    if (messages.length > 0 && selectedConversation) {
      const lastMsg = messages[messages.length - 1];
      setChatUser(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          if (user._id === selectedConversation._id) {
            return {
              ...user,
              lastMessage: {
                message: lastMsg.message,
                senderId: lastMsg.senderId,
                createdAt: lastMsg.createdAt
              }
            };
          }
          return user;
        });

        // Re-sort active conversation to the top
        return [...updatedUsers].sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
          return dateB - dateA;
        });
      });
    }
  }, [messages, selectedConversation]);

  // Sync selected conversion changes to keep active highlighted user updated
  useEffect(() => {
    if (selectedConversation) {
      setSelectedUserId(selectedConversation._id);
      // Clear unread count when clicking active chat
      setUnreadMessages(prev => ({
        ...prev,
        [selectedConversation._id]: 0
      }));
    } else {
      setSelectedUserId(null);
    }
  }, [selectedConversation]);

  // Load chatters on component mount
  useEffect(() => {
    const chatUserHandler = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/user/currentchatters');
        if (response.data.success === false) {
          console.log(response.data.message);
        } else {
          setChatUser(response.data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    chatUserHandler();
  }, []);

  // Server-side search submit for new users
  const handelSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/user/search?search=${searchInput}`);
      if (response.data.success === false) {
        console.log(response.data.message);
      } else {
        if (response.data.length === 0) {
          toast.info("User Not Found");
        } else {
          setSearchUser(response.data);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handelUserClick = (user) => {
    onSelectUser(user);
    setSelectedConversation(user);
    setSelectedUserId(user._id);
    setUnreadMessages(prev => ({
      ...prev,
      [user._id]: 0
    }));
  };

  const handSearchback = () => {
    setSearchUser([]);
    setSearchInput('');
  };

  const triggerLogoutConfirm = () => {
    setShowLogoutModal(true);
  };

  const executeLogout = async () => {
    if (logoutConfirmInput !== authUser.username) {
      toast.error("Incorrect username");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/logout');
      if (response.data?.success === false) {
        console.log(response.data?.message);
      }
      toast.info(response.data?.message || "Logged out successfully");
      localStorage.removeItem('chatapp');
      setAuthUser(null);
      setSelectedConversation(null);
      navigate('/login');
    } catch (error) {
      console.log(error);
      toast.error("Logout failed");
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
      setLogoutConfirmInput("");
    }
  };

  // Live client-side local active chats filter
  const filteredChatUsers = chatUser.filter(user =>
    user.username.toLowerCase().includes(searchInput.toLowerCase()) ||
    (user.fullname && user.fullname.toLowerCase().includes(searchInput.toLowerCase()))
  );

  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className='h-full w-full px-3 flex flex-col justify-between text-white'>
      {/* Search & Profile Header */}
      <div className='flex items-center justify-between gap-3 pt-3 pb-1'>
        <form onSubmit={handelSearchSubmit} className='flex-1 flex items-center bg-white/10 border border-white/10 rounded-full px-3 py-1 focus-within:border-sky-500/50 focus-within:shadow-[0_0_12px_rgba(14,165,233,0.2)] transition duration-300'>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            type='text'
            className='w-full bg-transparent border-none outline-none text-white text-sm placeholder-gray-400'
            placeholder='Search or start new chat'
          />
          <button type="submit" className='text-gray-400 hover:text-white transition duration-200 p-1'>
            <FaSearch size={14} />
          </button>
        </form>

        <div className="relative group cursor-pointer" onClick={() => navigate(`/profile/${authUser?._id}`)}>
          <img
            src={authUser?.profilepic || "/avatar.png"}
            alt='My Profile'
            className='h-10 w-10 rounded-full object-cover border border-orange-500/50 hover:border-orange-500 transition duration-300 shadow-md'
          />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#1e293b]"></span>
        </div>
      </div>

      <div className='h-[1px] bg-white/10 my-3'></div>

      {/* Main Lists Section */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {loading && chatUser.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <div className="loading loading-spinner text-sky-500"></div>
          </div>
        ) : searchUser?.length > 0 ? (
          // Server Search Results
          <div className="space-y-1">
            <p className="text-xs text-sky-400 font-semibold px-2 pb-1">Search Results</p>
            {searchUser.map((user) => {
              const active = onlineUser.includes(user._id);
              return (
                <div key={user._id}>
                  <div
                    onClick={() => handelUserClick(user)}
                    className={`flex gap-3 items-center rounded-xl p-3 cursor-pointer hover:bg-white/5 transition-all duration-200 ${
                      selectedUserId === user._id ? 'bg-sky-600/35 border border-sky-400/20 shadow-md' : 'border border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={user.profilepic || "/avatar.png"}
                        alt={user.username}
                        className="w-11 h-11 rounded-full object-cover border border-white/10"
                      />
                      {active && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-[#1e293b] rounded-full"></span>
                      )}
                    </div>
                    <div className='flex flex-col flex-1 min-w-0'>
                      <p className='font-semibold text-white truncate'>{user.username}</p>
                      <p className='text-xs text-sky-400 font-medium'>Found in Directory</p>
                    </div>
                  </div>
                  <div className='h-[1px] bg-white/5 mx-2 my-1'></div>
                </div>
              );
            })}
          </div>
        ) : (
          // Active chat list with live local filtering
          <div className="space-y-1">
            {filteredChatUsers.length === 0 ? (
              <div className='font-medium items-center justify-center flex flex-col h-40 text-center text-gray-400 px-4'>
                <p className="text-base mb-1">No chats found 💬</p>
                <p className="text-xs text-gray-500">Search for a username above to start chatting!</p>
              </div>
            ) : (
              filteredChatUsers.map((user) => {
                const active = onlineUser.includes(user._id);
                const unreadCount = unreadMessages[user._id] || 0;
                const hasLastMsg = !!user.lastMessage;
                const isSentByMe = hasLastMsg && user.lastMessage.senderId === authUser._id;

                return (
                  <div key={user._id}>
                    <div
                      onClick={() => handelUserClick(user)}
                      className={`flex gap-3 items-center rounded-xl p-3 cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                        selectedUserId === user._id
                          ? 'bg-sky-600/35 border border-sky-400/20 shadow-md'
                          : 'border border-transparent'
                      }`}
                    >
                      {/* Avatar with dynamic pulsing dot */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={user.profilepic || "/avatar.png"}
                          alt={user.username}
                          className={`w-11 h-11 rounded-full object-cover border-2 ${
                            active ? 'border-lime-500' : 'border-white/10'
                          }`}
                        />
                        {active && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-lime-500 border-2 border-[#1e293b] rounded-full animate-pulse"></span>
                        )}
                      </div>

                      {/* Username, Sneak-peek, and meta */}
                      <div className='flex-1 min-w-0 flex flex-col justify-between'>
                        <div className="flex justify-between items-baseline">
                          <p className={`font-semibold truncate ${selectedUserId === user._id ? 'text-white' : 'text-gray-200'}`}>
                            {user.username}
                          </p>
                          {hasLastMsg && (
                            <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">
                              {formatMessageTime(user.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-0.5">
                          <p className="text-xs text-gray-400 truncate pr-2">
                            {hasLastMsg ? (
                              <>
                                <span className="font-medium text-gray-300">
                                  {isSentByMe ? 'You: ' : ''}
                                </span>
                                {user.lastMessage.message}
                              </>
                            ) : (
                              <span className="italic text-gray-500">Tap to chat</span>
                            )}
                          </p>

                          {unreadCount > 0 && (
                            <span className="flex-shrink-0 bg-green-500 text-[10px] text-black font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center animate-bounce">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='h-[1px] bg-white/5 mx-2 my-1'></div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Back to normal list button during active Search result state */}
      {searchUser?.length > 0 && (
        <div className='py-2 flex border-t border-white/5'>
          <button onClick={handSearchback} className='flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition text-xs font-semibold'>
            <IoArrowBackSharp size={16} />
            <span>Go Back</span>
          </button>
        </div>
      )}

      {/* Bottom Profile & Logout Action Bar */}
      <div className='border-t border-white/10 py-3 mt-auto flex items-center justify-between'>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <img
              src={authUser?.profilepic || "/avatar.png"}
              alt="My Avatar"
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border border-[#1e293b]"></span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-400 font-medium">Logged in as</span>
            <span className="text-xs font-bold text-sky-400 truncate max-w-[100px]">{authUser?.username}</span>
          </div>
        </div>

        <button
          onClick={triggerLogoutConfirm}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 transition text-xs font-semibold text-red-400 hover:text-white border border-red-500/20 duration-200"
        >
          <BiLogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* Modern Glass Confirmation Modal for Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b1b2d]/90 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl backdrop-blur-xl animate-fade-in text-white">
            <h3 className="text-lg font-bold mb-2">Confirm Logout</h3>
            <p className="text-gray-300 text-xs leading-relaxed mb-4">
              Are you sure you want to logout? Please type your username <span className="font-semibold text-orange-400">"{authUser.username}"</span> below to finalize.
            </p>
            <input
              type="text"
              placeholder="Type username here"
              value={logoutConfirmInput}
              onChange={(e) => setLogoutConfirmInput(e.target.value)}
              className="w-full px-4 py-2.5 mb-4 bg-white/5 border border-white/15 rounded-xl text-white outline-none focus:border-sky-500 transition placeholder-gray-500 text-sm"
            />
            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  setLogoutConfirmInput("");
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executeLogout}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition font-bold border border-red-500/20"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;