const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs')
const colors = require('colors/safe')

function getAllURL(url){
  var listURL = []
  listURL[0] = url
  for(var i = 1; i<35; i++){
    listURL[i] = url + '/page-'+ (i+1).toString()
  }
  return listURL;
}

//function which collects the list of restaurants but with incomplete informations
async function getAllResto(listAllURL,chunkSize){
  var listAllResto = []
  let promises=[]
  var lastLevel=0
	for (var i = 0; i < listAllURL.length; i ++){	
		promises.push(getRestaurantsOfMichelinPage(listAllURL[i],i+1))//Called the function which collects all the restaurants for the given michelin page and stock it in a promises list
		console.log("Waiting for restaurants of page "+(i+1)+"/"+listAllURL.length)
		if(((i+1)%chunkSize==0)||(i==listAllURL.length-1)){//As we deal with asynchronous function, we define breakpoints (with chunkSize) for waiting the resolution of the current promises 
			await Promise.all(promises).then(response=>{//response is a js array of the following form: [{value:.,restaurants:[]},...,{value:.,restaurants:[]}]
				response.sort(function (chunkA, chunkB) {
					return chunkA.value - chunkB.value;
				})//not mandatory but more convenient for us to see the restaurants sorted in the same order as on the website
				var restaurants=response.map(chunk=>chunk.restaurants)//An array of array of restaurants
				restaurants.forEach(function(element) {
					element.forEach(function(element){
						listAllResto.push(element)//we push the restaurants in the final list
					})
				})
				//the last part is just for give indications on the progression
				var pageFrom=(i+1-chunkSize+1)
				if(i==listAllURL.length-1)pageFrom=lastLevel
				console.log(colors.green("Restaurants added to the list (from page "+pageFrom+" to "+(i+1)+")\n"))
				lastLevel=(i+2)
				promises=[]
			})
		}	
	}
  return listAllResto
}
//this function collects the information on restaurants which can be find directly on the list of the starred restaurants on michelin website without going to specific restaurant url
function getRestaurantsOfMichelinPage(pageUrl,pageNb){
	return new Promise((resolve, reject) => {
		axios.get(pageUrl).then(function (response) {
			var result={page:pageNb,restaurants:[]}
			const html = response.data
			const $ = cheerio.load(html)
			var info = $('.poi-search-result').find('a')
			info.each((k, el) => {
				var url="https://restaurant.michelin.fr"+$(el).attr('href')
				var dataStar = $(el).find('.guide').find('span')
				var name=$(el).find($('.poi_card-display-title')).text().trim()
				var nbStar
				if($(dataStar).hasClass('icon-cotation1etoile'))nbStar=1
				else if($(dataStar).hasClass('icon-cotation2etoiles'))nbStar=2
				else if($(dataStar).hasClass('icon-cotation3etoiles'))nbStar=3
				var restaurant={name:name,url:url,nbStar:nbStar,postalCode:"",chef:""}
				result.restaurants.push(restaurant)				
			})
			console.log("Restaurants of page "+(pageNb)+" have been added to the list")		
			resolve(result)
		}).catch(function (error) {
			reject(error)
		})
	})
}
//function which complete the informations for the list of restaurants
async function getAllRestoWithAllInformation(listAllResto,chunkSize){
	var promises=[]
	var lastLevel=0
	for(let i=0;i<listAllResto.length;i++){
		promises.push(getFullDetails(listAllResto[i])) //same principle as in getAllResto
		if(((i+1)%chunkSize==0)||(i==listAllResto.length-1)){
			await Promise.all(promises).then(response=>{
				var pageFrom=(i+1-chunkSize+1)
				if(i==listAllResto.length-1)pageFrom=lastLevel
				console.log(colors.green("Restaurant "+pageFrom+" to "+(i+1)+ " / "+listAllResto.length+" updated"))
				lastLevel=(i+2)
			})
		}
	}
	return listAllResto
}

//function which collects and adds the additional informations for a given restaurant 
function getFullDetails(resto){
	return new Promise((resolve, reject) => {
		axios.get(resto.url).then(function (response){
			const html = response.data
			const $ = cheerio.load(html)
			resto.postalCode = $('.postal-code').first().text().trim()
			resto.chef=$('.field--name-field-chef').find('.field__item').text().trim()
			resolve(resto)			
		}).catch(function (error) {
		  reject(error)
		})
	})
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
//For update the json, remove the '/**/' and launch: node michelin.js
/*


const urlMichelin = "https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin"
//Step 1: Find all url pages of michelin where we can find starred restaurants
const listAllURL = getAllURL(urlMichelin)
//Step 2: Get all restaurants in scraping the michelin pages (thanks to urls) and write the restaurants in a json
getAllResto(listAllURL,10).then(function(response){	
	writeObjInJSON("./JSON/MichelinRestaurantsBasis.json",response)	
	console.log(colors.green("List of all restaurants loaded. Some information need to be completed\n"))
	getAllRestoWithAllInformation(response,30).then(function(response){
		console.log(colors.green("List of all restaurants updated\n"))
		writeObjInJSON("./JSON/MichelinRestaurants.json",response)	
		console.log("Restaurants are now available in ./JSON/MichelinRestaurants.json")
	}).catch(function (error) {
		console.log(error)
		console.log(colors.red("An error has occurred in the update. Retry or access the list via the json"))
	})
}).catch(function (error) {
	console.log(error)
	console.log(colors.red("An error has occurred in the load. Retry or access the list via the json"))
})
	
	

*/

//We can now get the restaurants with the JSON File (faster but maybe not up to date)
module.exports.getRestaurantsFromJson=getObjectFromJSON("./JSON/MichelinRestaurants.json")

