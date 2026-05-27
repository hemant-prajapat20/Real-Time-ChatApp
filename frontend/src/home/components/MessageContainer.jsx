import React, { useEffect, useState, useRef } from 'react';
import userConversation from '../../Zustand/UseConversation';
import { useAuth } from '../../context/AuthContext';
import { RiMessage3Fill } from "react-icons/ri";
import { IoArrowBackSharp, IoSend } from 'react-icons/io5';
import { BsEmojiSmile, BsTrash } from "react-icons/bs";
import axios from 'axios';
import { useSocketContext } from '../../context/SocketContext';
import notify from '../../assets/sound/notification.wav';
import EmojiPicker from "emoji-picker-react";
import { toast } from 'react-toastify';

const MessageContainer = ({ onBackUser }) => {
  const { messages, selectedConversation, setMessage, setSelectedConversation } = userConversation();
  const { socket, onlineUser } = useSocketContext();
  const { authUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendData, setSendData] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  // Custom Clear Chat modal state
  const [showClearModal, setShowClearModal] = useState(false);
  
  const lastMessageRef = useRef();
  const emojiPickerRef = useRef();

  // Emoji picker click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData) => {
    setSendData(prev => prev + emojiData.emoji);
  };

  const formatIndianDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    const timeStr = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('en-IN');
    
    if (date.toDateString() === now.toDateString()) {
      return timeStr;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`;
    }
    
    return `${dateStr}, ${timeStr}`;
  };

  // Socket: typing state
  useEffect(() => {
    socket?.on("typing", () => setIsTyping(true));
    socket?.on("stopTyping", () => setIsTyping(false));
    return () => {
      socket?.off("typing");
      socket?.off("stopTyping");
    };
  }, [socket]);

  // Socket: receive new messages
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      // Only append if it's for the currently open conversation
      if (selectedConversation && newMessage.senderId === selectedConversation._id) {
        const sound = new Audio(notify);
        sound.play().catch(e => console.log("Audio play error:", e));
        setMessage([...messages, newMessage]);
      }
    };

    socket?.on("newMessage", handleNewMessage);
    return () => socket?.off("newMessage", handleNewMessage);
  }, [socket, setMessage, messages, selectedConversation]);

  // Auto scroll on new messages
  useEffect(() => {
    setTimeout(() => {
      lastMessageRef?.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, isTyping]);

  // Fetch conversation messages
  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      try {
        const get = await axios.get(`/api/message/${selectedConversation?._id}`);
        const data = await get.data;
        if (data.success === false) {
          console.log(data.message);
        } else {
          setMessage(data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedConversation?._id) {
      getMessages();
      setIsTyping(false); // Reset typing when chat changes
    }
  }, [selectedConversation?._id, setMessage]);

  // Emit typing indicators on input changes
  const handleMessages = (e) => {
    setSendData(e.target.value);
    if (socket && selectedConversation) {
      socket.emit("typing", { receiverId: selectedConversation._id });
      
      // Debounce stopTyping
      if (window.typingTimeout) clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socket.emit("stopTyping", { receiverId: selectedConversation._id });
      }, 1500);
    }
  };

  // Send message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sendData.trim()) return;
    
    setSending(true);
    // Instantly stop typing indicator
    if (socket && selectedConversation) {
      socket.emit("stopTyping", { receiverId: selectedConversation._id });
    }
    
    try {
      const res = await axios.post(`/api/message/send/${selectedConversation?._id}`, { messages: sendData });
      const data = await res.data;
      if (data.success === false) {
        console.log(data.message);
      } else {
        setSendData('');
        setShowEmoji(false);
        setMessage([...messages, data]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Clear conversation history
  const handleClearConversation = async () => {
    try {
      setLoading(true);
      const response = await axios.delete(`/api/message/clear/${selectedConversation?._id}`);
      if (response.data.success) {
        setMessage([]);
        toast.info("Conversation cleared successfully");
      } else {
        toast.error("Failed to clear chat");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error clearing chat");
    } finally {
      setLoading(false);
      setShowClearModal(false);
    }
  };

  const isUserOnline = selectedConversation && onlineUser?.includes(selectedConversation._id);

  return (
    <div className="md:min-w-[500px] h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-[#071321] via-[#0c243c] to-[#143a5e] text-white">
      
      {selectedConversation === null ? (
        // Empty State UI
        <div className='flex items-center justify-center w-full h-full px-4 text-center'>
          <div className='max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl animate-fade-in flex flex-col items-center gap-4'>
            <div className="p-4 bg-sky-500/10 rounded-full border border-sky-500/20 text-sky-400">
              <RiMessage3Fill className='text-5xl animate-pulse'/>
            </div>
            <h2 className='text-2xl font-bold text-white'>Welcome, {authUser?.username}! 👋</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Select a friend from the side menu or look them up to start sending messages in real-time.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Active Chat Header */}
          <div className="flex items-center justify-between bg-white/5 border-b border-white/10 backdrop-blur-md px-4 h-16 shadow-lg z-10">
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <div className='md:hidden'>
                  <button onClick={() => onBackUser(true)} className='p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white'>
                    <IoArrowBackSharp size={20} />
                  </button>
                </div>

                {/* Profile Avatar + Online indicator */}
                <div className="relative cursor-pointer">
                  <img
                    src={selectedConversation?.profilepic || "/avatar.png"}
                    alt="user"
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                  {isUserOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-lime-500 border-2 border-[#0c243c] rounded-full"></span>
                  )}
                </div>

                {/* Username and Online state subtitle */}
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm md:text-base leading-tight">
                    {selectedConversation?.username}
                  </span>
                  <span className="text-[10px] md:text-xs text-gray-400">
                    {isUserOnline ? (
                      <span className="text-lime-400 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-lime-400 rounded-full animate-ping"></span>
                        Active Now
                      </span>
                    ) : (
                      "Offline"
                    )}
                  </span>
                </div>
              </div>

              {/* Clear conversation action */}
              <button
                onClick={() => setShowClearModal(true)}
                title="Clear Chat History"
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-600 transition text-red-400 hover:text-white border border-red-500/20 duration-200"
              >
                <BsTrash size={16} />
              </button>
            </div>
          </div>

          {/* Messages Scrolling Grid */}
          <div className='flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent'>
            {loading && (
              <div className="flex justify-center items-center h-full">
                <div className="loading loading-spinner text-sky-400 scale-125"></div>
              </div>
            )}

            {!loading && messages?.length === 0 && (
              <div className="flex items-center justify-center h-48 text-center px-6">
                <div className="bg-white/5 border border-white/5 px-6 py-4 rounded-2xl max-w-xs text-gray-400 text-xs">
                  Say hello! Send a message to start your conversation with {selectedConversation?.username}.
                </div>
              </div>
            )}

            {!loading && messages?.length > 0 && messages?.map((message) => {
              const isMe = message.senderId === authUser._id;

              return (
                <div
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full animate-fade-in`}
                  key={message?._id}
                  ref={lastMessageRef}
                >
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-tr-none'
                          : 'bg-white/10 border border-white/5 text-gray-100 rounded-tl-none backdrop-blur-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 opacity-80 px-1 font-medium">
                      {formatIndianDateTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Bouncing Dots Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start w-full animate-fade-in">
                <div className="flex flex-col items-start">
                  <div className="bg-white/10 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center shadow-sm backdrop-blur-sm">
                    <span className="h-2 w-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-[8px] text-sky-400 mt-1 font-semibold pl-1">
                    {selectedConversation?.username} is typing...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Emoji Picker container */}
          {showEmoji && (
            <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-2xl border border-white/10 overflow-hidden animate-fade-in">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={350}
                width={300}
                theme="dark"
                searchDisabled
              />
            </div>
          )}

          {/* Typing Form & Actions Bottom Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white/5 border-t border-white/10 backdrop-blur-md flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white/10 border border-white/10 rounded-full px-3 py-1 focus-within:border-sky-500/50 focus-within:shadow-[0_0_12px_rgba(14,165,233,0.15)] transition duration-300">
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-1.5 text-gray-400 hover:text-sky-400 transition"
              >
                <BsEmojiSmile size={20} />
              </button>

              <input
                value={sendData}
                onChange={handleMessages}
                required
                id="message"
                type="text"
                autoComplete="off"
                className="flex-1 bg-transparent border-none outline-none text-white text-sm px-3 py-1.5 placeholder-gray-400"
                placeholder="Type your message..."
              />
            </div>

            <button
              type="submit"
              disabled={sending || !sendData.trim()}
              className="p-3 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-full transition shadow-md flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
            >
              {sending ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <IoSend size={18} />
              )}
            </button>
          </form>

          {/* Modern Glass Confirmation Modal for Clear Chat */}
          {showClearModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[#0b1b2d]/90 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl backdrop-blur-xl animate-fade-in text-white">
                <h3 className="text-lg font-bold mb-2">Clear Conversation?</h3>
                <p className="text-gray-300 text-xs leading-relaxed mb-5">
                  Are you sure you want to delete all messages with <span className="font-semibold text-sky-400">"{selectedConversation?.username}"</span>? This action cannot be undone and will permanently wipe the chat history.
                </p>
                <div className="flex justify-end gap-3 text-xs">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearConversation}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition font-bold border border-red-500/20"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MessageContainer;
