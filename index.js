const castle=require("./castle.js")
const michelin=require("./michelin.js")
const fs = require('fs')

const hotels=castle.getProperties
const restaurants=michelin.getRestaurantsFromJson


String.prototype.sansAccent = function(){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
     
    var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }     
    return str;
}

function processingName(name,chefOption=false){
	if(chefOption)return name.toLowerCase().sansAccent().replace("&","et").replace("et  ","et ")
	return name.toLowerCase().sansAccent()
}
function getStarredRestaurants(){
	var RestaurantsWithStars=[]
	for(let i=0;i<hotels.length;i++){	
		var hotel=hotels[i]
		for(let j=0;j<hotel.restaurants.length;j++){
			var restStarred=restaurants.find(restaurant=>(processingName(restaurant.name)==processingName(hotel.restaurants[j].name))&&
										(restaurant.postalCode.substring(0,1)==hotel.postalCode.substring(0,1)))
			if(restStarred!=null){			
				RestaurantsWithStars.push({hotel:hotel.name,restaurant:restStarred.name,stars:restStarred.nbStar})
			}
			else if(j==0){
				restStarred=restaurants.find(restaurant=>((restaurant.postalCode.substring(0,1)==hotel.postalCode.substring(0,1))&&
										(processingName(restaurant.chef,true)==processingName(hotel.chef,true)&&restaurant.chef!="")))
				if(restStarred!=null){	
					RestaurantsWithStars.push({hotel:hotel.name,restaurant:restStarred.name,stars:restStarred.nbStar})
				}	
			}	
		}
	}
	return RestaurantsWithStars
}
function writeObjInJSON(path,jsobject){
	var data = JSON.stringify(jsobject)
    fs.writeFileSync(path, data)
}


var starredRestaurants=getStarredRestaurants()
writeObjInJSON("./JSON/StarredRestaurantsFromR&C.json",starredRestaurants)


