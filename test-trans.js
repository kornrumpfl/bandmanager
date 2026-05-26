async function test() {
  const text = `Look at the stars
look how they shine for you
and everything you do
yeah they were all yellow`;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  const translated = data[0].map(item => item[0]).join('');
  console.log(translated);
}
test();
