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


async function getAllResto(listAllURL){

  var listAllResto = []

	for (var i = 0; i < listAllURL.length; i ++){
	console.log("Page "+(i+1)+"/"+listAllURL.length)
    await axios.get(listAllURL[i]).then(function (response) {
      const html = response.data
      const $ = cheerio.load(html)
      var info = $('.poi-search-result').find('a')
      info.each( (k, el) => {
		var url="https://restaurant.michelin.fr"+$(el).attr('href')
        var dataStar = $(el).find('.guide').find('span')
		var name=$(el).find($('.poi_card-display-title')).text().trim()
		var nbStar
		if($(dataStar).hasClass('icon-cotation1etoile'))nbStar=1
		else if($(dataStar).hasClass('icon-cotation2etoiles'))nbStar=2
		else if($(dataStar).hasClass('icon-cotation3etoiles'))nbStar=3
		listAllResto.push({name:name,url:url,nbStar:nbStar})
      })

    })
    .catch(function (error) {
      console.log(error)
    })
	
  }
  return listAllResto
}
function writeObjInJSON(path,jsobject){
	var data = JSON.stringify(jsobject)
    fs.writeFileSync(path, data)
}

function getObjectFromJSON(jsonFile){
    const file = fs.readFileSync(jsonFile)
    const object = JSON.parse(file)
    return object
}
//Step 1: Find all url pages of michelin starred restaurants
const listAllURL = getAllURL(url)
//Step 2: Get all restaurants in scraping the michelin pages (thanks to urls) and write the restaurants in a json
/*getAllResto(listAllURL).then(function(response){
	writeObjInJSON("./JSON/MichelinRestaurants.json",response)
})*/
const restaurants=getObjectFromJSON("./JSON/MichelinRestaurants.json")
module.exports.getRestaurants = restaurants
