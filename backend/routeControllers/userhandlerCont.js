import Conversation from "../Models/conversationModels.js";
import User from "../Models/userModels.js";

export const getUserBySearch=async(req,res)=>{
    try{
    const search =req.query.search ||'';
    const currentUserID = req.user._id;
    const user=await User.find({
       $and:[
      {
          $or:[
            {username:{$regex:'.*'+ search+'.*',$options:'i'}},
            {fullname:{$regex:'.*'+ search+'.*',$options:'i'}}
            ]
       },{
         _id:{$ne:currentUserID}
        }
       ] 
      }).select("-password").select("email")
      res.status(200).send(user)
    }
     catch(error){
        res.status(500).send({ 
        success: false,
        message: error
       })
       console.log(error); 
    }
}

export const getCurrentChatters = async (req, res) => {
  try {
    const currentUserID = req.user._id.toString();
    const conversations = await Conversation.find({
      participants: currentUserID
    })
    .sort({ updatedAt: -1 })
    .populate({
      path: "messages",
      options: { sort: { createdAt: -1 }, limit: 1 }
    })
    .populate({
      path: "participants",
      select: "-password -email"
    });

    if (!conversations || conversations.length === 0) {
      return res.status(200).send([]);
    }

    const chatters = conversations.map((convo) => {
      const otherParticipant = convo.participants.find(
        (p) => p && p._id.toString() !== currentUserID
      );
      if (!otherParticipant) return null;

      const lastMsg = convo.messages && convo.messages.length > 0 ? convo.messages[0] : null;

      return {
        _id: otherParticipant._id,
        fullname: otherParticipant.fullname,
        username: otherParticipant.username,
        gender: otherParticipant.gender,
        profilepic: otherParticipant.profilepic,
        lastMessage: lastMsg ? {
          message: lastMsg.message,
          senderId: lastMsg.senderId,
          createdAt: lastMsg.createdAt
        } : null,
        updatedAt: convo.updatedAt
      };
    }).filter(Boolean);

    res.status(200).send(chatters);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || error
    });
    console.log(error);
  }
};