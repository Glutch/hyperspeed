const sharp = require('sharp')
const fetch = require('node-fetch')

const test = async () => {
  const url = 'https://images.unsplash.com/photo-1602525653218-cac7c9e38807?ixid=MXwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80'
  const res = await fetch(url)
  const buffer = await res.buffer()
  // sharp(buffer).resize(1080).jpeg({quality: 70}).toFile('test.jpg')
  // sharp(buffer).resize(1080).webp({quality: 70}).toFile('test.WebP')
  sharp(buffer).resize(1080).toFile('test3.webp')
}
test()