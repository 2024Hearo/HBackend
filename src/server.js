const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = "hearos-414916-firebase-adminsdk-bfrdw-763fae27a9.json"
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;
app.use(bodyParser.json());

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'hearos-414916.appspot.com', 
  databaseURL: 'https://hearos-414916-default-rtdb.firebaseio.com'
});

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const bucket = admin.storage().bucket();
const firebase = require("@firebase/app");

  firebase.initializeApp(firebaseConfig);
app.use(express.json());
app.use(cors());


// 마이페이지 API 엔드포인트
app.get('/mypage', async (req, res) => {
  try {
    const userId = req.headers.authorization;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRecord = await admin.auth().getUser(userId);

    const userName = userRecord.displayName;
    const formattedUserName = `${userName} 님`;

    return res.json({ userName: formattedUserName });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Error fetching user' });
  }
});


app.get('/sound/play/:filename', async (req, res) => {
  const filename = req.params.filename;

  const file = bucket.file(`sound/${filename}`);

  try {
    console.log(`Attempting to read file: sound/${filename}`);

    const [fileExists] = await file.exists();

    if (!fileExists) {
      console.log(`File not found: sound/${filename}`);
      return res.status(404).json({ error: 'MP3 file not found' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');

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

app.get('/sound/soundlist', async (req, res) => {
  try {
    const [files] = await bucket.getFiles({ prefix: 'sound/' });

    if (files.length === 0) {
      return res.status(404).json({ error: 'No file exists' });
    }

    const fileList = files.map(file => file.name);

    res.status(200).json({ soundList: fileList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

app.delete('/sound/delete', async (req, res) => {
  try {
    const filename = req.body.filename; 

    const file = bucket.file(`sound/${filename}`);
    const [exists] = await file.exists();

    // Handle Errors
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    await file.delete();

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});



const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage
 });


app.post('/sound/addsound', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {

      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { buffer, originalname } = req.file;
    

    const file = bucket.file(`sound/${originalname}`);
    await file.save(buffer);
    
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});


app.get('/vedio/play/:filename', async (req, res) => {
  const filename = req.params.filename;


  const file = bucket.file(`vedio/${filename}`);

  try {
    console.log(`Attempting to read file: vedio/${filename}`);

    const [fileExists] = await file.exists();

    if (!fileExists) {
      console.log(`File not found: vedio/${filename}`);
      return res.status(404).json({ error: 'MP4 file not found' });
    }

    res.setHeader('Content-Type', 'video/mp4');

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

app.delete('/voice/deletevoice/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    const file = bucket.file(`voice/${filename}`);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    await file.delete();

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

app.post('/voice/addvoice', upload.single('file'), async (req, res) => {
try {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { buffer, originalname } = req.file;
  
  const file = bucket.file(`voice/${originalname}`);
  await file.save(buffer);
  
  res.status(200).json({ message: 'File uploaded successfully' });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Error uploading file' });
}
});

app.post('/run/voice', (req, res) => {
  console.log('Received request on /run/voice');

  const pythonProcess = spawn('python', ['./Voice.py']);

  pythonProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      res.send({ message: 'Voice.py script executed successfully', code });
  });
});

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
            roomId: roomId, 
            accepted: room.accepted || false,
            inviter: {
              uid: room.inviter ? room.inviter.uid : '', 
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

    const userChatRoomRef = admin.database().ref(`/Users/${userId}/ChatRooms/${roomId}`);
    const userChatRoomSnapshot = await userChatRoomRef.once('value');
    const userChatRoomData = userChatRoomSnapshot.val();

    if (!userChatRoomData) {
      console.error('User ChatRoom data not found');
      res.status(500).json({ success: false, error: 'User ChatRoom data not found' });
      return;
    }

    const inviterUid = userChatRoomData.inviter.uid;

    const chatRoomRef = admin.database().ref(`/chatRooms/${roomId}`);
    
    const participantsRef = chatRoomRef.child('participants');

    await participantsRef.update({
      [userId]: true,
      [inviterUid]: true,
    });

    await userChatRoomRef.update({
      accepted: true,
    });

    res.json({ success: true, accepted: true });
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
    const digit = Math.floor(Math.random() * 10); 
    roomId += digit.toString();
  }

  return roomId;
}



app.listen(port, () => {
  console.log(`server connected`);
});