const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require("./hearo-17195-firebase-adminsdk-b9b6j-1b370181e9.json");
const multer = require('multer');
const fs = require('fs');
const { connect } = require('http2');

const app = express();
const port = 3000;

// Firebase 초기화
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://hearo-2024', // Firebase Storage 버킷 URL
  });

  const bucket = admin.storage().bucket();


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

  app.listen(port, () => {
    console.log(`server connected`);
  });
