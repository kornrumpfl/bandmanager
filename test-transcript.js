async function test() {
  const videoId = 'dQw4w9WgXcQ';
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(url);
  const text = await res.text();
  
  const match = text.match(/"captions":\s*({.*?})[\s\]}]*,"videoDetails"/);
  if (match) {
    const captions = JSON.parse(match[1]);
    console.log(JSON.stringify(captions, null, 2));
  } else {
    console.log("No captions found");
  }
}
test();
