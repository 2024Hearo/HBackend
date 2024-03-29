const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require("./hearo-17195-firebase-adminsdk-b9b6j-1b370181e9.json");
const multer = require('multer');

const app = express();
const port = 3000;

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://hearo-2024', // Firebase Storage 버킷 URL
});

const bucket = admin.storage().bucket();

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

//마이보이스 추가하기
// Multer 설정 (메모리에 저장)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

app.listen(port, () => {
  console.log(`server connected`);
});