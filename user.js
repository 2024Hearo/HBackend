const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
const serviceAccount = require('./hearo-17195-firebase-adminsdk-b9b6j-1b370181e9.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hearo-17195-default-rtdb.firebaseio.com'
});

const app = express();
const port = 3000;

app.use(bodyParser.json());

// 회원가입 엔드포인트
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일 중복 확인
    const isDuplicate = await checkDuplicateEmail(email);
    if (isDuplicate) {
      return res.status(400).json({ error: '중복된 이메일입니다.' });
    }

    // 파이어베이스 Realtime Database에 회원 정보 저장
    await saveUserData(email, password);

    res.status(200).json({ message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 이메일 중복 확인 함수
async function checkDuplicateEmail(email) {
  const snapshot = await admin.database().ref('users').orderByChild('email').equalTo(email).once('value');
  return snapshot.exists();
}

// 회원 정보 저장 함수
async function saveUserData(email, password) {
  await admin.database().ref('users').push({
    email,
    password
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

