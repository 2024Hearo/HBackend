const express = require('express');
const fs = require('fs');

const app = express();
const port = 3000;

app.get('/video/play/:filename', (req, res) => {
  const filename = req.params.filename;
  const path = `./videos/${filename}`; // 영상 파일 경로

  try {
    // 파일이 존재하는지 확인
    if (!fs.existsSync(path)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    // 올바른 Content-Type 설정 (예: video/mp4)
    res.setHeader('Content-Type', 'video/mp4');

    // 파일 스트림 생성 및 응답에 파이프 연결
    const stream = fs.createReadStream(path);
    stream.pipe(res);

    // 오류 처리
    stream.on('error', (error) => {
      console.error('Error streaming video', error);
      res.status(500).json({ error: 'Error streaming video' });
    });
  } catch (error) {
    console.error('Error handling video request', error);
    res.status(500).json({ error: 'Error handling video request' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
