const mongoose = require('mongoose')

const ArticleSchema = new mongoose.Schema({
  date: String,
  title: String,
  sub_header: String,
  body: String,
  tags: Array,
  slug: String,
  published: Boolean,
})

module.exports = mongoose.models.Article || mongoose.model('Article', ArticleSchema)