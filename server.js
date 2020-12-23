const express = require('express')
const app = express()
const fs = require('fs')
const dbConnect = require('./dbConnect')
const Article = require('./models/Article')
const { create_article, create_index } = require('./ssr')
const port = 3010

app.use(express.static('public'))
app.use(express.json())

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

app.get('/create', (req, res) => res.sendFile(__dirname + `/create.html`))

app.post('/api/post', async (req, res) => {
  const article = req.body
  console.log(article)
  const slug_exists = await Article.findOne({slug: article.slug})
  if (article.slug && !slug_exists) {
    console.log(article.slug, slug_exists)
    await new Article({
      date: new Date(),
      ...article
     }).save()
     await create_article(article)
     console.log(1)
     await create_index()
     console.log(2)
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