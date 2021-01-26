const express = require('express')
const app = express()
const fs = require('fs')
const moment = require('moment')
const basicAuth = require('express-basic-auth')
const dbConnect = require('./dbConnect')
const Article = require('./models/Article')
const multer = require('multer')
const sharp = require('sharp')
const generate_sitemap = require('./api/sitemap')
const fetch = require('node-fetch')
const { create_article, create_index } = require('./ssr')
const port = 3010

const upload = multer({
  limits: {
    fileSize: 4 * 1024 * 1024,
  }
})

app.use('/images/', express.static('public/images'))
app.use(express.static('public'))
app.use(express.json())

const auth = basicAuth({users: { 'dromedardaze': '420stkorvar' }, challenge: true})

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

app.get('/create', auth, (req, res) => res.sendFile(__dirname + `/create.html`))

app.get('/upload', auth, (req, res) => res.sendFile(__dirname + `/upload.html`))

app.post('/api/download_image', upload.single('image'), async (req, res) => {
  const filename = Date.now()
  const url = req.body.url

  const resp = await fetch(url, {mode: 'no-cors'})
  const blob = await resp.buffer()

  await sharp(blob)
    .resize({width: 920 * 3})
    .toFile('public/images/' + filename + '-big.webp')

  await sharp(blob)
    .resize({width: 920 * 2})
    .toFile('public/images/' + filename + '-normal.webp')

  await sharp(blob)
    .resize({width: 920 * 1})
    .toFile('public/images/' + filename + '-small.webp')

  await sharp(blob)
    .resize({width: 920 / 2})
    .toFile('public/images/' + filename + '-smallest.webp')

  return res.status(200).redirect('/images/' + filename + '-big.webp')
})

app.post('/api/upload_image', upload.single('image'), async (req, res) => {
  const filename = Date.now()

  await sharp(req.file.buffer)
    .resize({width: 920 * 3})
    .toFile('public/images/' + filename + '-big.webp')

  await sharp(req.file.buffer)
    .resize({width: 920 * 2})
    .toFile('public/images/' + filename + '-normal.webp')

  await sharp(req.file.buffer)
    .resize({width: 920 * 1})
    .toFile('public/images/' + filename + '-small.webp')

  await sharp(req.file.buffer)
    .resize({width: 920 / 2})
    .toFile('public/images/' + filename + '-smallest.webp')

  return res.status(200).redirect('/images/' + filename + '-big.webp')
})

app.get('/api/article/:slug', async (req, res) => {
  const slug = req.params.slug
  const article = await Article.findOne({slug})
  res.send(article)
})

app.get('/api/unpublished', async (req, res) => {
  const unpublished = await Article.find({published: false})
  res.send({unpublished: unpublished.map(curr => curr.slug)})
})

app.get('/api/unpublishedCount', async (req, res) => {
  const unpublished = await Article.find({published: false}).countDocuments()
  res.send({count: unpublished})
})

app.post('/api/post', async (req, res) => {
  const article = req.body
  console.log('post', article)
  const slug_exists = await Article.findOne({slug: article.slug})
  if (article.slug && !slug_exists) {
    console.log(article.slug, slug_exists)
    await new Article({
      date: Date.now(),
      published: false,
      ...article
    }).save()
    res.send({ message: 'added to queue'})
  } else {
    res.send({ message: 'slug exists' })
  }
})

app.get('/api/post-slug/:slug', async (req, res) => {
  const slug = req.params.slug
  const article = await Article.findOne({slug})
  await create_article(article)
  await Article.updateOne({slug}, {published: true})
  await create_index()
  res.send({message: `${slug} published`})
  console.log(slug)
})

app.get('/:page', (req, res) =>
  fs.readdir('./pages', (err, pages) =>
    pages.map(x => x.replace('.html', '')).includes(req.params.page)
      ? res.sendFile(__dirname + `/pages/${req.params.page}.html`)
      : res.sendFile(__dirname + `/pages/error.html`)
    )
)

setInterval(async () => {
  const latest_article = await Article.findOne({published: true}).sort({'date': -1})
  const _article = await Article.find({published: false}).sort({'date': 1})
  const article = _article[0]

  if (article) {
    if (!latest_article || !moment(latest_article.date).isSame(moment(Date.now()), 'day')) {
    // if (true) {
      await create_article(article)
      await Article.updateOne({slug: article.slug}, {date: Date.now(), published: true})
      await create_index()
      console.log('publishing', article.title)
    }
  }
  console.log('okey refreshing')
  generate_sitemap()
}, 1000 * 60 * 60 * 1) //en gång per timme

app.listen(port, () => console.log(`http://localhost:${port}`))
generate_sitemap()

// app.post('/api/download_image', upload.single('image'), async (req, res) => {
//   const filename = Date.now()
//   const url = req.body.url

//   const resp = await fetch(url, {mode: 'no-cors'})
//   const blob = await resp.buffer()

//   await sharp(blob)
//     .resize({width: 920 * 3})
//     .toFile('public/images/' + filename + '-3x.WebP')

//   await sharp(blob)
//     .resize({width: 920 * 2})
//     .toFile('public/images/' + filename + '-2x.WebP')

//   await sharp(blob)
//     .resize({width: 920 * 1})
//     .toFile('public/images/' + filename + '-1x.WebP')

//   return res.status(200).redirect('/images/' + filename + '-3x.WebP')
// })

// app.post('/api/upload_image', upload.single('image'), async (req, res) => {
//   const filename = Date.now()

//   await sharp(req.file.buffer)
//     .resize({width: 920 * 3})
//     .toFile('public/images/' + filename + '-3x.WebP')

//   await sharp(req.file.buffer)
//     .resize({width: 920 * 2})
//     .toFile('public/images/' + filename + '-2x.WebP')

//   await sharp(req.file.buffer)
//     .resize({width: 920 * 1})
//     .toFile('public/images/' + filename + '-1x.WebP')

//   return res.status(200).redirect('/images/' + filename + '-3x.WebP')
// })