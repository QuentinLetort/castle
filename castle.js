const request = require('request')
const rp = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')
const axios=require('axios')


async function getHotelsNameAndUrl(urlRelaisAndChateau){
	return await axios.get(urlRelaisAndChateau).then( (response) => {
		const html = response.data
        const $ = cheerio.load(html)
		var listCastle=[]
		var data = $('#countryF').eq(1).find('li')
		data.each(function(i,result){
			const name=$(result).find('a').eq(0).text().trim()
			const url=$(result).find('a').eq(0).attr('href')
			const chef=$(result).find('a').eq(1).text().trim()
			const hotel={ "name": name, "url":url,"chef":chef.replace(/Chef\s-\s/g,'')};			
			listCastle.push(hotel)	
		})		
		return listCastle
    })		
}

function getObjectFromJSON(jsonFile){
    const file = fs.readFileSync(jsonFile)
    const hotels = JSON.parse(file)
    return hotels
}


async function getHotelDetails(hotel){
    return await axios(hotel.url).then(async function(response){
			const html = response.data			
			const $ = cheerio.load(html)		
			var restaurant1= $('.jsSecondNavSub').find("li").first().find("a").text().trim()
			var url1= $('.jsSecondNavSub').find("li").first().find("a").attr('href')
			var restaurant2 = $('.jsSecondNavSub').find("li").next().find("a").text().trim()
			var url2= $('.jsSecondNavSub').find("li").next().find("a").attr('href')
			const type=$('.jsSecondNavMain').find("li").first().find("a").attr('data-id')
			if (restaurant1==''){
				if(type=='isProperty'){
					url1=$('.jsSecondNavMain').find("li").next().find("a").attr('href')
					var temp=await getNameRestaurant(url1)
					restaurant1=temp[0]
				}
            }			
            var result = {
                name: hotel.name,
                url: hotel.url,
				chef:hotel.chef,
				type: type,
                price: $('.price').text().trim(),
				postalCode: $('[itemprop="postalCode"]').first().text().replace(/\,/g, ''),
                city: $('[itemprop="addressLocality"]').first().text().trim(),
                restaurants: [{name: restaurant1,url:url1}]                 
            }
			if(restaurant2!=''){
				result.restaurants.push({name: restaurant2,url:url2})
			}
			if(restaurant2=="Autres restaurants"){				
				var temp=await getNameRestaurant(url2,1)
				for(let i=0;i<temp.length;i++){
					result.restaurants.push({name: temp[i],url:url2})
				}
				result.restaurants.splice(1,1)
			}
            return result
        })
        .catch(function(err){
        })
}
async function getNameRestaurant(url,multipleName=0){
	return await axios(url).then(function(response){
			const html = response.data			
			const $ = cheerio.load(html)
			var name=[]
			name.push($('.hotelTabsHeaderTitle').eq(0).find("h3").text().trim())			
			let k=1
			if(multipleName==1){
				while($('.hotelTabsHeaderTitle').eq(k).find("h3").text().trim()!=''){
					name.push($('.hotelTabsHeaderTitle').eq(k).find("h3").text().trim())
					k++
				}				
			}			
            return name
   })	
}

async function getHotels(hotels){
    var result = []
    for(let i = 0; i<hotels.length; i++)
    {		
        console.log('Hotel : ' + (i+1) + '/' + hotels.length)
        await getHotelDetails(hotels[i]).then(value => {
            result.push(value)
			console.log(value)
        })
    }
	return result;    
}
function writeObjInJSON(path,jsobject){
	var data = JSON.stringify(jsobject)
    fs.writeFileSync(path, data)
}
function missingValuesCount(array){
	var count=0;
	for(let i=0;i<array.length;i++){
		if(array[i]==null) count++;
	}
	return count
}
function missingValuesIdx(array){
	var res=[]
	var k=0
	for(let i=0;i<array.length;i++){
		if(array[i]==null){
			res[k]=i
			k++
		}
	}
	return res
}

//function to find the missing hotels after the scrapping
async function getMissingHotels(hotels,hotelsUrlAndName){
	while(missingValuesCount(hotels))
	{
		const idx=missingValuesIdx(hotels)
		var missingHotelsUrlAndName=[]
		for (let i=0;i<idx.length;i++){
			missingHotelsUrlAndName[i]=hotelsUrlAndName[idx[i]]
		}
		console.log(missingHotelsUrlAndName)
		await getHotels(missingHotelsUrlAndName).then(function(response){
			for (let i=0;i<idx.length;i++){
				hotels[idx[i]]=response[i]
			}			
		})
	}	
	return hotels
}
function removeNonHotels(hotels){
	for(let i=0;i<hotels.length;i++){
		if (hotels[i].type.includes('Restaurant')) {
			hotels.splice(i,1)
			i--
		}
	}
	return hotels
}
//For update the json, remove the '/**/' and launch: node castle.js (very long: we don't take advantage of async function and load each page one by one=>can be improve (see michelin.js))
/*

//First step: obtain hotels name and url which are available on https://www.relaischateaux.com/fr/site-map/etablissements and stock them in a JSON file
//Second step: obtain full details about hotels thanks to the url obtain previously
//As there may be errors in requesting relais&chateau, we create a function that verify all the properties are correctly loaded
const urlCastle='https://www.relaischateaux.com/fr/site-map/etablissements'

getHotelsNameAndUrl(urlCastle).then(function(response){
	writeObjInJSON("./JSON/R&C_url.json",response)
	var hotelsUrlAndName=response
	getHotels(hotelsUrlAndName).then(function(response){
		getMissingHotels(response,hotelsUrlAndName).then(function(response){
			writeObjInJSON("./JSON/R&C.json",removeNonHotels(response))
			console.log("\nHotels are now available in ./JSON/R&C.json")
		})
	})
})
*/


//We can now get the restaurants with the JSON File (faster but maybe not up to date)
var hotels=getObjectFromJSON("./JSON/R&C.json")

//console.log(hotels.length)

module.exports.getProperties=hotels
