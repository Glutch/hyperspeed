const express = require('express')
const app = express()
const fs = require('fs')
const moment = require('moment')
const basicAuth = require('express-basic-auth')
const dbConnect = require('./dbConnect')
const Article = require('./models/Article')
const { create_article, create_index } = require('./ssr')
const port = 3010

app.use(express.static('public'))
app.use(express.json())

const auth = basicAuth({users: { 'dromedardaze': '420stkorvar' }, challenge: true})

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

app.get('/secret', auth, (req, res) => res.send({message: 'welcome to the secrets'}))

app.get('/create', auth, (req, res) => res.sendFile(__dirname + `/create.html`))

setInterval(async () => {
  const latest_article = await Article.findOne({published: true}).sort({'date': -1})
  const _article = await Article.find({published: false}).sort({'date': 1})
  const article = _article[0]

  if (article) {
    if (!moment(latest_article.date).isSame(moment(Date.now()), 'day') || !latest_article) {
      await create_article(article)
      await Article.updateOne({slug: article.slug}, {published: true})
      await create_index()
      console.log('publishing', article.title)
    }
  }
  console.log('okey refreshing')
}, 1000 * 10) //en gång per timme

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

app.listen(port, () => console.log(`http://localhost:${port}`))