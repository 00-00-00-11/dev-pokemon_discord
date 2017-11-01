const api = require('./api.js'),
      battle = require('./battle.js'),
      moves = require('./moveTypes.js'),
      q = require('q');

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [rev. #1]
shuffle = (v) => {
    for(let j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    return v;
};

module.exports = {}

/*
 * Returns a warning message when there's an undefined command
 */
module.exports.unrecognizedCommand = (commandArray) => {
    let textString = "I fon't recognize the command _{cmd}_.";
    // remove 'pokemon'
    commandArray.shift();
    textString = textString.replace("{cmd}", commandArray.join(" "));
    return q.fcall(() => { return textString; });
}

module.exports.userChoosePokemon = (commandArray) => {
    let commandString = commandArray.join(" "),
        pokemonName = commandArray[3],
        textString = "You chose {pokemon}. It has {hp} HP, and knows ",
        moves = [],
        movePromises = [];
        
        // validate that the command was "pokemon i choose {pokemon}"
        if (!commandString.match(/i choose/i)) {
            return module.exports.unrecognizedCommand(commandArray);
        }
        return api.getPokemon(pokemonName).then((pokemonData) => {
            moves = shuffle(pokemonData.moves);
            for (let i = 0; i < 4; i++) {
                movePromises.push(
                    api.getMove("https://pokeapi.co"+ moves[i].resource_uri)
                    .then(battle.addMove)
                )

                // move format: "vine whip, lear, razor leaf, and tackle"
                if (i < 3) {
                    textString += moves[i].name;
                    textString += ", ";
                } else {
                    textString += "and ";
                    textString += moves[i].name;
                    textString += ".";
                }
            }
            return q.allSettled(movePromises)
            .then(() => {
                return battle.setUserHP(pokemonData.hp);
            })
            .then(() => {
                return battle.setUserPokemonTypes(pokemonData.types.map((val) => {
                    return val.name;
                }))
            })
            .then(() => {
                textString = textString.replace("{pokemon}", pokemonData.name);
                textString = textString.replace("{hp}", pokemonData.hp);
                let str = "" + pokemonData.pkdx_id;
                return {
                    text: textString,
                    spriteURL: "https://pokeapi.co/media/img/"+ str + ".png"
                }
            }); 
        });

        module.exports.npcChoosePokemon = (dex_no) => {
            let textString = "I chose {pokemon}.",
                moves = [],
                movePromises = [];
            return api.getPokemon(dex_no).then((pokemonData) => {
                moves = shuffle(pokemonData.moves);
                for (let i = 0; i < 4; i++) {
                    movePromises.push(
                        api.getMove("https://pokeapi.co"+moves[i].resource_uri)
                        .then(battle.addMoveNPC)
                    )
                }
                return q.allSettled(movePromises)
                .then(() => {
                    return battle.setUserHP(pokemonData.hp);
                })
                .then(() => {
                    return battle.setUserPokemonTypes(pokemonData.types.map((val) => {
                        return val.name;
                    }))
                })
                .then(() => {
                    textString = textString.replace("{pokemon}", pokemonData.name);
                    textString = textString.replace("{hp}", pokemonData.hp);
                    let str = "" + pokemonData.pkdx_id;
                    return {
                        text: textString,
                        spriteURL: "https://pokeapi.co/media/img/"+ str + ".png"
                    }
                }); 
            });
        }          
}


