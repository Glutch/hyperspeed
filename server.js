const express = require('express')
const app = express()
const fs = require('fs')
const dbConnect = require('./dbConnect')
const Article = require('./models/Article')
const { create_article, create_index } = require('./ssr')
const port = 3010

app.use(express.static('public'))
app.use(express.json())

const auth = (req, res, next) =>
  req.query.dromedardaze == '420stkorvar' ? next() : res.status(401).send()

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

app.get('/secret', auth, (req, res) => res.send({message: 'welcome to the secrets'}))

app.get('/create', (req, res) => res.sendFile(__dirname + `/create.html`))

setInterval(async () => {
  const _article = await Article.find({published: false}).sort({'date': 1})
  const article = _article[0]
  if (article) {
    console.log('slug', article.slug)
    console.log(article)
    await create_article(article)
    await Article.updateOne({slug: article.slug}, {published: true})
    await create_index()
    console.log('publishing', article.title)
  }
  console.log('okey refreshing')
}, 1000 * 10)
// }, 1000 * 60 * 5)

app.get('/api/unpublished', async (req, res) => {
  const unpublished = await Article.find({published: false})
  res.send(unpublished)
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

app.get('/:page', (req, res) =>
  fs.readdir('./pages', (err, pages) =>
    pages.map(x => x.replace('.html', '')).includes(req.params.page)
      ? res.sendFile(__dirname + `/pages/${req.params.page}.html`)
      : res.sendFile(__dirname + `/pages/error.html`)
  )
)



app.listen(port, () => console.log(`http://localhost:${port}`))