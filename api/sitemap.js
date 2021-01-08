const fs = require('fs')
const Article = require('../models/Article')

// const generate_sitemap = async () => {
//   let text = ''
//   const articles = await Article.find({published: true}).sort({date: -1})
//   articles.map(article => {
//     text += 'https://glutch.dev/' + article.slug + '\n'
//   })
//   fs.writeFile('./public/sitemap.txt', text, err => {
//     if (err) throw err
//     console.log('sitemap is created successfully.')
//   })
// }

// module.exports = generate_sitemap

const generate_sitemap = async () => {
  let text = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
  const articles = await Article.find({published: true}).sort({date: -1})
  articles.map(article => {
    text += `
<url>
  <loc>https://glutch.dev/${article.slug}</loc>
  <lastmod>${new Date(article.date).toISOString()}</lastmod>
</url>`
  })
  text += '</urlset>'

  fs.writeFile('./public/sitemap.xml', text, err => {
    if (err) throw err
    console.log('sitemap is created successfully.')
  })
}

module.exports = generate_sitemap