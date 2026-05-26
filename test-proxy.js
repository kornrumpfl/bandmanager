async function test() {
  const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const res = await fetch(url);
  const text = await res.text();
  const match = text.match(/"captions":\s*({.*?})[\s\]}]*,"videoDetails"/);
  if (match) {
    console.log("Success! Captions found.");
  } else {
    console.log("Failed. No captions.");
  }
}
test();
