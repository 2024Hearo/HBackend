const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require("./hearo-17195-firebase-adminsdk-b9b6j-1b370181e9.json");
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://hearo-2024', // Firebase Storage 버킷 URL
  databaseURL: 'https://hearo-17195-default-rtdb.firebaseio.com'
});

const bucket = admin.storage().bucket();
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


// 마이페이지 API 엔드포인트
app.get('/mypage', async (req, res) => {
  try {
    // 클라이언트에서 요청된 사용자의 ID 가져오기 (예: 클라이언트에서 헤더에 인증된 사용자의 ID를 전송)
    const userId = req.headers.authorization;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Firebase에서 사용자 정보 가져오기
    const userRecord = await admin.auth().getUser(userId);

    // 사용자의 이름을 가져와서 클라이언트에 반환
    const userName = userRecord.displayName;
    const formattedUserName = `${userName} 님`;

    return res.json({ userName: formattedUserName });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Error fetching user' });
  }
});


//소리 재생하기
app.get('/sound/play/:filename', async (req, res) => {
  const filename = req.params.filename;

  // Firebase Storage에서 파일을 읽어오기
  const file = bucket.file(`sound/${filename}`);

  try {
    console.log(`Attempting to read file: sound/${filename}`);

    const [fileExists] = await file.exists();

    if (!fileExists) {
      console.log(`File not found: sound/${filename}`);
      return res.status(404).json({ error: 'MP3 file not found' });
    }

    // Set the content type to audio/mpeg
    res.setHeader('Content-Type', 'audio/mpeg');

    // Create a readable stream from the file and pipe it to the response
    const stream = file.createReadStream();
    stream.pipe(res);

    // Handle errors
    stream.on('error', (error) => {
      console.error(`Error streaming file: sound/${filename}`, error);
      res.status(500).json({ error});
    });
  } catch (error) {
    console.error(`Error checking file existence: sound/${filename}`, error);
    res.status(500).json({ error });
  }
});

//소리 목록 가져오기
app.get('/sound/soundlist', async (req, res) => {
  try {
    // Firebase Storage에서 파일 목록을 읽어오기
    const [files] = await bucket.getFiles({ prefix: 'sound/' });

    // 파일 목록이 없을 경우 에러 처리
    if (files.length === 0) {
      return res.status(404).json({ error: 'No file exists' });
    }

    // 파일 목록을 반환
    const fileList = files.map(file => file.name);

    res.status(200).json({ soundList: fileList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

// 파일 삭제하기
app.delete('/sound/delete', async (req, res) => {
  try {
    const filename = req.body.filename; // 클라이언트에서 전송한 파일의 식별자

    // Firebase Storage에서 파일 삭제
    const file = bucket.file(`sound/${filename}`);
    const [exists] = await file.exists();

    // 파일이 존재하지 않으면 에러 반환
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 파일 삭제
    await file.delete();

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});


//소리 추가하기
// Multer 설정 (메모리에 저장)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage
 });

 // 파일 업로드하는 POST API 엔드포인트
app.post('/sound/addsound', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      // 클라이언트가 파일을 제대로 업로드하지 않은 경우
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { buffer, originalname } = req.file;
    
    // Firebase Storage에 파일 업로드
    const file = bucket.file(`sound/${originalname}`);
    await file.save(buffer);
    
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

//영상 재생하기
app.get('/vedio/play/:filename', async (req, res) => {
  const filename = req.params.filename;

  // Firebase Storage에서 파일을 읽어오기
  const file = bucket.file(`vedio/${filename}`);

  try {
    console.log(`Attempting to read file: vedio/${filename}`);

    const [fileExists] = await file.exists();

    if (!fileExists) {
      console.log(`File not found: vedio/${filename}`);
      return res.status(404).json({ error: 'MP4 file not found' });
    }

    // Set the content type to audio/mpeg
    res.setHeader('Content-Type', 'video/mp4');

    // Create a readable stream from the file and pipe it to the response
    const stream = file.createReadStream();
    stream.pipe(res);

    // Handle errors
    stream.on('error', (error) => {
      console.error(`Error streaming file: vedio/${filename}`, error);
      res.status(500).json({ error});
    });
  } catch (error) {
    console.error(`Error checking file existence: vedio/${filename}`, error);
    res.status(500).json({ error });
  }
});

//마이보이스 삭제하기
app.delete('/voice/deletevoice/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    // Firebase Storage에서 파일 삭제
    const file = bucket.file(`voice/${filename}`);
    const [exists] = await file.exists();

    // 파일이 존재하지 않으면 에러 반환
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 파일 삭제
    await file.delete();

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

// 파일을 추가하는 POST API 엔드포인트
app.post('/voice/addvoice', upload.single('file'), async (req, res) => {
try {
  if (!req.file) {
    // 클라이언트가 파일을 제대로 업로드하지 않은 경우
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { buffer, originalname } = req.file;
  
  // Firebase Storage에 파일 업로드
  const file = bucket.file(`voice/${originalname}`);
  await file.save(buffer);
  
  res.status(200).json({ message: 'File uploaded successfully' });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Error uploading file' });
}
});

//채팅
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
        const rooms = await Promise.all(Object.entries(chatRooms).map(async ([roomId, room]) => {
          const participantsSnapshot = await admin.database().ref(`/ChatRooms/${room.ChatRoomID}/participants`).once('value');
          const participants = participantsSnapshot.val();

          let inviterData = {};
          if (room.inviter && room.inviter.uid) {
            const inviterSnapshot = await admin.database().ref(`/Users/${room.inviter.uid}`).once('value');
            inviterData = inviterSnapshot.val();
          }

          return {
            roomId: roomId, // Use the roomId from the loop
            accepted: room.accepted || false,
            inviter: {
              uid: room.inviter ? room.inviter.uid : '', // inviter가 정의되어 있는지 확인
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



app.listen(port, () => {
  console.log(`server connected`);
});