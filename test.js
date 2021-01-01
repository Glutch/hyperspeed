const moment = require('moment')



const article = 1609192715714
const latest_article = 1609192433414
const now = 1609327301223
console.log(Date.now())

console.log(moment(latest_article).isSame(moment(now), 'day'))

console.log(article - latest_article)


console.log(moment(now).format('MMMM Do YYYY'))