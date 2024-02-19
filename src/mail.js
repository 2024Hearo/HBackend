const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const serviceAccount = require("./hearo-17195-firebase-adminsdk-b9b6j-15b39067a1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hearo-17195-default-rtdb.firebaseio.com"
});

const app = express();

const firebase = require("@firebase/app");
const firebaseConfig = {
    apiKey: "AIzaSyCoFo4_3pM9ooJCKuI3LSUbIOvUTGPWzuA",
    authDomain: "hearo-17195.firebaseapp.com",
    databaseURL: "https://hearo-17195-default-rtdb.firebaseio.com",
    projectId: "hearo-17195",
    storageBucket: "hearo-17195.appspot.com",
    messagingSenderId: "976399412290",
    appId: "1:976399412290:web:d567798b3c55d64f9c91db",
    measurementId: "G-VNX2N0CQBG"
  };

  firebase.initializeApp(firebaseConfig);

app.use(express.json());
app.use(cors());

app.post('/invite', async (req, res) => {
  try {
    const { chatRoomName, email, token } = req.body;

    const decodedToken = await admin.auth().verifyIdToken(token);
    const inviterId = decodedToken.uid;

    const inviterRoomsRef = admin.database().ref(`/Users/${inviterId}`);
    const inviterSnapshot = await inviterRoomsRef.once('value');
    const inviterName = inviterSnapshot.val().name || '';

    const userRecord = await admin.auth().getUserByEmail(email);

    if (!userRecord) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    const roomId = generateRandomRoomId();

    const inviteeRef = admin.database().ref(`/Users/${userRecord.uid}/ChatRooms`);
    const newChatRoomForInvitee = inviteeRef.push({
      ChatRoomID: roomId,
      roomname: chatRoomName,
      inviter: {
        uid: inviterId,
        name: inviterName,
      },
    });

    const inviterRef = admin.database().ref(`/Users/${inviterId}/ChatRooms`);
    const newChatRoomForInviter = inviterRef.push({
      ChatRoomID: roomId,
      roomname: chatRoomName,
      invitee: {
        uid: userRecord.uid,
        name: userRecord.displayName || '',
      },
    });

    res.json({
      success: true,
      roomId: newChatRoomForInvitee.key,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


app.get('/check-invite-status', async (req, res) => {
  try {
    const { userId } = req.query;

    const userRef = admin.database().ref(`/Users/${userId}/ChatRooms`);
    userRef.once('value', async (snapshot) => {
      const chatRooms = snapshot.val();

      if (chatRooms) {
        const rooms = await Promise.all(Object.values(chatRooms).map(async room => {
          const participantsSnapshot = await admin.database().ref(`/ChatRooms/${room.ChatRoomID}/participants`).once('value');
          const participants = participantsSnapshot.val();

          const inviterSnapshot = await admin.database().ref(`/Users/${room.inviter.uid}`).once('value');
          const inviterData = inviterSnapshot.val();

          return {
            roomId: room.ChatRoomID,
            accepted: room.accepted || false,
            invite: room.invite || null,
            inviter: {
              uid: room.inviter.uid,
              name: inviterData.displayName || '', 
            },
          };
        }));

        const accepted = rooms.some(room => room.accepted === true);
        res.json({ success: true, accepted: accepted, rooms: rooms });
      } else {
        res.json({ success: true, accepted: false, rooms: [] });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


app.post('/accept-invite', async (req, res) => {
  try {
    const { userId, roomId } = req.body;

    // 사용자가 속한 채팅방에서 'accepted' 값을 true로 업데이트
    const userChatRoomRef = admin.database().ref(`/Users/${userId}/ChatRooms/${roomId}`);
    const userChatRoomSnapshot = await userChatRoomRef.once('value');
    const userChatRoomData = userChatRoomSnapshot.val();

    if (!userChatRoomData) {
      console.error('User ChatRoom data not found');
      res.status(500).json({ success: false, error: 'User ChatRoom data not found' });
      return;
    }

    // Get inviter's UID from the user's ChatRoom data
    const inviterUid = userChatRoomData.inviter.uid;

    // 채팅방의 'participants'에 상대와 나의 userId 추가
    const chatRoomRef = admin.database().ref(`/chatRooms/${roomId}`);
    
    // Create a new entry for the room if it doesn't exist
    const participantsRef = chatRoomRef.child('participants');

    await participantsRef.update({
      [userId]: true,
      [inviterUid]: true,
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


app.post('/reject-invite', async (req, res) => {
  try {
    const { userId, roomId } = req.body;

    const userChatRoomRef = admin.database().ref(`/Users/${userId}/ChatRooms/${roomId}`);
    await userChatRoomRef.remove();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '내부 서버 오류' });
  }
});

function generateRandomRoomId() {
  const length = 8;
  let roomId = '';

  for (let i = 0; i < length; i++) {
    const digit = Math.floor(Math.random() * 10); // 0부터 9까지의 랜덤한 숫자
    roomId += digit.toString();
  }

  return roomId;
}

// 서버 실행 지우지 말기 
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
