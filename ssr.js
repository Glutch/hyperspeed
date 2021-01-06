const fs = require('fs')
const moment = require('moment')
const md = require('markdown-it')
const hljs = require('highlight.js')
const fonts = require('./things/fonts')
const header = require('./things/header')
const slugify = require('./public/js/slugify')
const ColorHash = require('color-hash')
const colorHash = new ColorHash()
const dbConnect = require('./dbConnect')
const Article = require('./models/Article')
const prettify = require('html-prettify')

const markdown_example = `
quite simple mmmmkey
# HELLOO
\`\`\`js
app.get('/:page', (req, res) => {
  const page = req.params.page
  if (page == 'hello') {
    return nextApp.render(req, res, '/article', { article: { title: 'How tooo' } })
  }
  console.log(req.params.page)
  return nextApp.render(req, res, '/index', req.query)
})
\`\`\`
done!
`

const markdown = md({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }
    return ''
  },
  modifyToken: function (token, env) {
    //test webp & quality 0.6-0.7
    switch (token.type) {
    case 'image':
      // token.attrObj.srcset = `${token.attrObj.src.replace('-3x', '-1x')} 1x, ${token.attrObj.src.replace('-3x', '-2x')} 2x, ${token.attrObj.src} 3x`;
      token.attrObj.srcset = `${token.attrObj.src.replace('big', 'smallest')} 460w,
                              ${token.attrObj.src.replace('big', 'small')} 920w,
                              ${token.attrObj.src.replace('big', 'normal')} 1840w,
                              ${token.attrObj.src.replace('big', 'big')} 2760w`
      token.attrObj.sizes = '(max-width: 460px) 460px, 920px'
      break;
    case 'link_open':
      token.attrObj.target = '_blank'; // set all links to open in new window
      break;
    }
  }
}).use(require('markdown-it-modify-token')); // <-- this use(package_name) is required

const generate_article = (article, content) => prettify(`
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" href="favicon.png" />
    <meta name="description" content="${article.sub_header}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <link rel="preload" as="style" href="style.css">
    <link rel="stylesheet" href="style.css">
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "image": "https://glutch.dev/favicon.png",
        "author": {
          "@type": "Person",
          "name": "Glutch"
        },
        "headline": "${article.title}",
        "datePublished": "${moment(article.date).format('MMMM Do YYYY')}",
        "publisher": {
          "@type": "Organization",
          "name": "glutch.dev",
          "logo": {
            "@type": "ImageObject",
            "url": "https://glutch.dev/favicon.png"
          }
        }
      }
    </script>
  </head>
  <body>
    ${header}
    <main>
      `) + content + prettify(`
    </main>
  </body>
</html>`)

const generate_index = content => prettify(`
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" href="favicon.png" />
    <meta name="description" content="super quick tutorials on a super fast website">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>quikker</title>
    <link rel="preload" as="style" href="style.css">
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    ${header}
    <main>
      ${content}
    </main>
  </body>
</html>`)

const create_article = async (article) => {
  const content = `
  <article>
    <h1>${article.title}</h1>
    <h2>${article.sub_header}</h2>
    ${markdown.render(article.body)}
  </article>
  `

  fs.writeFile(`./pages/${article.slug}.html`, generate_article(article, content), () => {
    console.log(article.title, 'created')
    return 'complete'
  })
}

const create_index = async () => {
  // ${colorHash.hex(tag)}
  const articles = await Article.find({published: true}).sort({date: -1})
  let content = ''
  articles.map(article => {
    content += `
      <a href="/${article.slug}" style="padding: 20px; background: #000; margin-bottom: 10px; width: 100%; max-width: 900px; border-bottom: 2px solid #222">
        <div style="display: flex; align-items: center;">
          ${article.tags && article.tags.reduce((sum, tag) => sum += `<div style="padding: 3px 5px; color: #000; font-size: 12px; background: #fff; border-radius: 2px; margin-right: 5px">${tag}</div>`, '')}
          <div style="font-size: 14px; color: #999">${moment(article.date).format('MMMM Do YYYY')}</div>
        </div>
        <h1 style="margin-top: 10px; margin-bottom: 0; font-size: 34px">${article.title}</h1>
        <h2 style="margin-top: 0; font-size: 24px">${article.sub_header}</h2>
      </a>`
  })
  fs.writeFile(`./index.html`, generate_index(content), () => {
    console.log('index.html', 'created')
    return 'complete'
  })
}

module.exports = { create_article, create_index}

const recreate = async () => {
  const articles = await Article.find({published: true}).sort({date: -1})
  articles.map(article => create_article(article))
  create_index()
}

recreate()