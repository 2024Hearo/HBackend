const express = require('express');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
const serviceAccount = require('./hearo-17195-firebase-adminsdk-b9b6j-1b370181e9.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hearo-17195-default-rtdb.firebaseio.com'
});

const app = express();

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
  
      return res.json({ userId, userName: formattedUserName });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Error fetching user' });
    }
  });

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

