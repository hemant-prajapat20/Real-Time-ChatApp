import React, {useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import MessageContainer from './components/MessageContainer';

const Home = () =>{

 const[selectedUser ,setSelectedUser] = useState(null);
 const[isSidebarVisible ,setIsSidebarVisible]= useState(true);

 const handelUserSelect=(user)=>{
    setSelectedUser(user);
    setIsSidebarVisible(false);
  }
 const handelShowSidebar=()=>{
    setIsSidebarVisible(true);
    setSelectedUser(null);
  }
  


  return (
    <div className="
  flex w-full max-w-7xl mx-auto  h-[92vh] md:h-[95vh] rounded-2xl shadow-2xl
  bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden
">

    <div className={`w-full py-2 md:flex ${isSidebarVisible ? '' : 'hidden'}`}>
    <Sidebar onSelectUser={handelUserSelect}/>
    </div>

    <div className={`divider divider-horizontal px-3 md:flex
      ${isSidebarVisible ? '' : 'hidden'} ${selectedUser ? 'block' : 'hidden'}`}></div>
   
    <div className={`flex-auto ${selectedUser ? '' : 'hidden md:flex'} bg-gray-200 `}>
    <MessageContainer onBackUser={handelShowSidebar}/>
    </div>

    </div>
  );
};

export default Home;