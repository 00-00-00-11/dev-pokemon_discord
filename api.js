const request = require('request')
const q = require('q')

module.exports = {}

module.exports.getPokemon = (name) => {
    let deferred = q.defer()
    request("http://pokeapi.co/api/v2/pokemon/"+name, (error, response, body) => {
        if (response.statusCode == 200) {
            deferred.resolve(JSON.parse(body));
        } else {
            deferred.reject(new Error("Error getting Pokemon"));
        }
    })
    return deferred.promise
}

module.exports.getSprite = (url) => {
    let deferred = q.defer()
    request(url, (error, response, body) => {
        if (response.statusCode == 200) {
            deferred.resolve(JSON.parse(body));
        } else {
            deferred.reject(new Error("Error getting Sprite"));
        }
    })
    return deferred.promise
}

module.exports.getMove = (url) => {
    let deferred = q.defer()
    request(url, (error, response, body) => {
        if (response.statusCode == 200) {
            deferred.resolve(JSON.parse(body));
        } else {
            deferred.reject(new Error("Error getting Move"));
        }
    })
    return deferred.promise
}

module.exports.getAttackMultiplier = (offensive, defensive1, defensive2) => {
    let multiplier = 1,
        typeArray = [
        "normal",
        "fighting",
        "flying",
        "poison",
        "ground",
        "rock",
        "bug",
        "ghost",
        "steel",
        "fire",
        "water",
        "grass",
        "electric",
        "psychic",
        "ice",
        "dragon",
        "dark",
        "fairy"
        ],
        typeId = typeArray.indexOf(offensive.toLowerCase()) + 1,
        deferred = q.defer()
    request("http://pokeapi.co/api/v2/type"+typeId, (error, response, body) => {
        if(response.statusCode == 200) {
            const d = JSON.parse(body),
                ineffective = d.ineffective.map((val) => {return val.name}),
                noeffect = d.no_effect.map((val) => {return val.name}),
                supereffective = d.super_effective.map((val) => {return val.name})
            [defensive1, defensive2].forEach((element) => {
                if (ineffective.indexOf(type) !== -1) { multiplier *= 0.5 }
                if (noeffect.indexOf(type) !== -1) { multiplier *= 0 }
                if (supereffective.indexOf(type) !== -1) { multiplier *= 2 }
            })
            deferred.resolve(multiplier)
        } else {
            deferred.reject(new Error("Error with multiplier"))
        }
    })
}