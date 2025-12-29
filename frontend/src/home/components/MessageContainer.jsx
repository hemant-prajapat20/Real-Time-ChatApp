
import React, {useEffect, useState,useRef} from 'react';
import userConversation from '../../../Zustand/UseConversation';
import {useAuth} from '../../context/AuthContext';
import { RiMessage3Fill } from "react-icons/ri";
import {IoArrowBackSharp,IoSend} from 'react-icons/io5';
import axios from 'axios';
import {useSocketContext} from '../../context/SocketContext';
import notify from '../../assets/sound/notification.wav';
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";


const MessageContainer =({ onBackUser }) =>{
    const {messages,selectedConversation,setMessage,setSelectedConversation} = userConversation();
    const {socket} = useSocketContext();
    const { authUser } = useAuth();
    const [loading, setLoading] =useState(false);
    const [sending , setSending] =useState(false);
    const [sendData , setSnedData] =useState("")
    const lastMessageRef = useRef();
    const [isTyping, setIsTyping] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);

//emoji ke liye
const handleEmojiClick =(emojiData) =>{
  setSnedData(prev => prev + emojiData.emoji);
};

//typing or not
useEffect(() => {
  socket?.on("typing", () =>setIsTyping(true));
  socket?.on("stopTyping", () =>setIsTyping(false));
  return () =>{
    socket?.off("typing");
    socket?.off("stopTyping");
  };
}, [socket]);

//jb message receive hoga
   useEffect(()=>{
     socket?.on("newMessage",(newMessage)=>{
       const sound = new Audio(notify);
       sound.play();
       setMessage([...messages,newMessage])
      })
    return ()=> socket?.off("newMessage");
   },[socket,setMessage,messages])

   // auto scroll ke liye
   useEffect(()=>{
      setTimeout(()=>{
       lastMessageRef?.current?.scrollIntoView({behavior:"smooth"})
       },100)
    },[messages])

// message ko fetch krne ke liye
   useEffect(() =>{
      const getMessages = async()=>{
      setLoading(true);
        try{
          const get = await axios.get(`/api/message/${selectedConversation?._id}`);
          const data = await get.data;
           if (data.success === false){
            setLoading(false);
            console.log(data.message);
           }
            setLoading(false);
            setMessage(data);
          }catch(error){
            setLoading(false);
            console.log(error);
          }
       }

       if (selectedConversation?._id) getMessages();
        }, [selectedConversation?._id, setMessage])
        console.log(messages);

        
        
// typing emit show
   const handelMessages=(e)=>{
     setSnedData(e.target.value);
     socket.emit("typing", { receiverId: selectedConversation._id });
      setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selectedConversation._id });
  },1000);
      }

      // send message ke liye..
 const handelSubmit=async(e)=>{
   e.preventDefault();
   setSending(true);
     try{
      const res =await axios.post(`/api/message/send/${selectedConversation?._id}`,{messages:sendData});
      const data = await res.data;
      if (data.success === false){
        setSending(false);
        console.log(data.message);
     }
      setSending(false);
      setSnedData('');
      setShowEmoji(false);
        setMessage([...messages,data])
      }catch (error) {
        setSending(false);
        console.log(error);
   }
 }

 return (
//chat backround
<div className=' md:min-w-[500px] h-[99%] flex flex-col py-2
  relative overflow-hidden  bg-gradient-to-br from-[#0a2540]
   via-[#0f3d5e] to-[#1e5fa3] '>

{/* // chat jb empty state me hoga */}

   {selectedConversation === null ? (
    <div className='flex items-center justify-center w-full h-full'>
      <div className='px-4 text-center text-2xl text-gray-950 font-semibold 
                flex flex-col items-center gap-2'>
     <p className='text-2xl'>Welcome!!👋 {authUser.username}😉</p>
        <p className="text-lg">Select a chat to start messaging</p>
     <RiMessage3Fill className='text-6xl text-center'/>
       </div>
     </div>
   ) : (
     <>

     {/* chat screen ka header */}
  <div className='flex justify-between gap-1 bg-sky-600 md:px-2 rounded-lg h-12 md:h-12'>
    <div className='flex gap-2 md:justify-between items-center w-full'>
     <div className='md:hidden ml-1 self-center'>
         <button onClick={() =>onBackUser(true)} className='bg-white rounded-full px-2 py-1 self-center'>
         <IoArrowBackSharp size={25} color='black'
         />
     </button>
    </div>

    <div className='flex justify-between mr-2 gap-2'>
       <div className='self-center'>
<img
  src={selectedConversation?.profilepic || "/avatar.png"} alt="user"
  className="rounded-full w-8 h-8 md:w-10 md:h-10 object-cover border border-white"/>
    </div>

      <span className='text-gray-950 self-center text-sm md:text-xl font-bold'>
       {selectedConversation?.username}
       </span>
     </div>
   </div>
</div>

    {/* message ke liye   */}
 <div className='flex-1 overflow-auto'>
                      
   {loading && (
     <div className="flex w-full h-full flex-col items-center justify-center gap-4 bg-transparent">
<div className="loading loading-spinner">
</div>
     </div>
   )}


  {!loading && messages?.length === 0 && (
     <p className='text-center text-white items-center'>Send a message to 
     start Conversation</p>
   )}

   {!loading && messages?.length > 0 && messages?.map((message) =>(
  
     <div className='text-white' key={message?._id} ref={lastMessageRef}>
       <div className={`chat ${message.senderId === authUser._id ? 'chat-end' : 'chat-start'}`}>
         <div className='chat-image avatar'></div>
         <div className={`chat-bubble ${message.senderId === authUser._id ? 'bg-sky-600':''
   }`}>
     {message.message}
   
   </div>
   <div className="chat-footer text-[10px] opacity-80">
     {new Date(message?.createdAt).toLocaleDateString('en-IN')}{' '}
     {new Date(message?.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute:
        'numeric'})}
   </div>
 </div>
    </div>
  ))}
 </div>
 
 {isTyping &&(
 <div className="px-4 py-1 animate-pulse">
    <span className="text-base font-medium text-sky-300 italic">  
  {selectedConversation?.username} is typing...
  </span>
  </div>
)}

{showEmoji && (
  <div className="absolute bottom-14 left-4 z-50">
    <EmojiPicker
      onEmojiClick={handleEmojiClick}
      height={350}
      width={300}
      theme="dark"
    />
  </div>
)}


 <form onSubmit={handelSubmit} className='rounded-full text-black'>
{/* emoji ke liye */}
<div className='w-[98%] mx-auto rounded-full flex items-center bg-white'>
  <button type="button"
 onClick={() => setShowEmoji(!showEmoji)}
 className="px-2">
  <BsEmojiSmile size={22} className="text-gray-600 hover:text-sky-600" />
</button>

   <input value={sendData} onChange={handelMessages} required id='message' type='text' 
  className='w-full bg-transparent outline-none px-4 py-1 rounded-full'/>
     <button type='submit'>
       {sending ? <div className='loading loading-spinner'></div>:
       <IoSend size={25}
       className='text-sky-700 cursor-pointer rounded-full bg-gray-800 w-10 h-auto p-1'/>
       }
     </button>
     </div>
     </form>
   </>
    )}

  </div>
    )
}

export default MessageContainer
