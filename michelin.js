const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs')

const url = "https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin"

function getAllURL(url){
  var listURL = []
  listURL[0] = url
  for(var i = 1; i<35; i++){
    listURL[i] = url + '/page-'+ (i+1).toString()
  }
  return listURL;
}

function getAllResto(listAllURL){

  var listAllResto = []
  var listTemp = []

  for (var i = 0; i < listAllURL.length; i ++){
    axios.get(listAllURL[i]).then(function (response) {
      const html = response.data
      const $ = cheerio.load(html)
      var info = $('div .poi_card-display-title')

      info.each( (k, el) => {
        var restoName = $(el).text();
        restoName = restoName.replace(/\s\s+/g, '');
		console.log(restoName)
        listTemp[k]={restoName}
		
      })

      for(var j = 0; j < listTemp.length; j ++){
        listAllResto.push(listTemp[j])
      }
      var obj = {
        listOfResto:[]
      }

      for (var i = 0; i < listAllResto.length; i ++){
        obj.listOfResto.push(listAllResto[i])
        var data = JSON.stringify(obj, null, 2)
        fs.writeFileSync('listResto.json', data)
      }

    })
    .catch(function (error) {
      console.log(error)
    })
  }
}

const listAllURL = getAllURL(url)
const res = getAllResto(listAllURL)
module.exports = getAllResto
