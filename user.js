const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = require('./hearo-17195-firebase-adminsdk-b9b6j-1b370181e9.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hearo-17195.firebaseio.com', // Firestore URL로 수정
});
  

app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, name, email } = decodedToken;

    // Firestore에 사용자 정보 저장
    await admin.firestore().collection('users').doc(uid).set({ name, email });

    // JWT 토큰 발급
    const accessToken = jwt.sign({ uid, name, email }, 'your-secret-key', {
        expiresIn: '1h',
    });
      

    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
