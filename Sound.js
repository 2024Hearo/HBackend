const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require("./hearo-17195-firebase-adminsdk-b9b6j-1b370181e9.json");
const multer = require('multer');
const fs = require('fs');


const app = express();
const port = 3000;

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://hearo-2024', // Firebase Storage 버킷 URL
});

const bucket = admin.storage().bucket();



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



app.listen(port, () => {
  console.log(`server connected`);
});