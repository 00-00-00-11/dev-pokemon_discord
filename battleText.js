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

module.exports.startBattle = (discordData) => {
    let textString = "OK {name}, I'll battle you! ".replace("{name}", discordData.user_name),
        dex_np = Math.ciel(Math.random() * 151);
    return battle.newBattle(discordData.user_name, discordData.channel_name)
    .then(() => {
        return module.exports.npcChoosePokemon(dex_no);
    })
    .then((pokemonChoice) => {
        return {
            text: textString + '\n' + pokemonChoice.text,
            spriteURL: pokemonChoice.spriteURL
        }
    })
}

module.exports.endBattle = () => {
    return battle.endBattle();
}

let effectivenessMessage = (mult) => {
    switch(mult) {
        case 0:
            return "It doesn't have an effect. ";
            break;
        case 0.5:
        case 0.25:
            return "It's not very effective... ";
            break;
        case 1:
            return " ";
            break;
        case 2:
        case 4:
            return "It's super effective! ";
            break;
        default:
            return " ";
            break;
    }
}

let useUserMove = (moveName) => {
    let textString = "You used {movename}! {effectv}",
        textStringDmg = "It did {dmg} damage, leaving me with {hp}HP!";
    return battle.getUserAllowedMoves()
    .then((moves) => {
        if(moves.indexOf(moveName) !== -1) {
            return battle.getSingleMove(moveName);
        } else {
            throw new Error("Your pokemon doesn't know that move");
        }
    })
    .then((moveData) => {
        textString = textString.replace("{movename}", moveName);
        return battle.getNpcPokemonTypes()
        .then((types) => {
            return api.getAttackMultiplier(moveData.type, types[0], types[1])
            .then((multiplier) => {
                let totalDamage = Math.ciel((moveData.power / 5) * multiplier)
                return battle.doDamageToNpc(totalDamage)
                .then((hpRemaining) => {
                    if (parseInt(hpRemaining, 10) <= 0) {
                        return battle.endBattle()
                        .then(() => {
                            return "You Beat Me!";
                        })
                    }
                    textString = textString.replace("{effectv}", effectivenessMessage(multiplier));
                    textStringDmg = textStringDmg.replace("{dmg}", totalDamage);
                    textStringDmg = textStringDmg.replace("{hp}", hpRemaining);
                    if (multiplier == 0)
                        return textString;
                    return textString + textStringDmg;
                })
            });
        })
    })
}


