const dbConnect = require('./dbConnect')
const Article = require('./models/Article')
Article.collection.drop()
console.log('deleted all articles')