const moves = require('./moveTypes.js'),
    q = require('q')

let redis, rtg

if (process.env.REDISTOGO_URL) {
    rtg = require("url").parse(process.env.REDISTOGO_URL)
    redis = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1])
} else {
    redis = require("redis").createClient()
}

qredis = {}
qredis.sadd = q.nbind(redis.sadd, redis)
qredis.hmset = q.nbind(redis.hmset, redis)
qredis.hgetall = q.nbind(redis.hgetall, redis)
qredis.exists = q.nbind(redis.exists, redis)
qredis.del = q.nbind(redis.del, redis)
qredis.set = q.nbind(redis.set, redis)
qredis.get = q.nbind(redis.get, redis)
qredis.decrby = q.nbind(redis.decrby, redis)
qredis.smembers = q.nbind(redis.smembers, redis)

module.exports = {}

module.exports.newBattle = (playerName, channel) => {
    return qredis.exists("currentBattle")
    .then((exists) => {
        if (!exists) {
            return qredis.hmset("currentBattle", {
                "playerName": playerName,
                "channel": channel
            })
        } else {
            throw new Error("Battle exists")
        }
    })
}

module.exports.getBattle = () => {
    return qredis.hgetall("currentBattle")
}

module.exports.endBattle = () => {
    return qredis.del([
        "currentBattle",
        "user:allowedMoves",
        "opponent:allowedMoves",
        "npc:allowedMoves",
        "npc:hp",
        "opponent:hp",
        "user:hp",
        "user:pokemonTypes",
        "opponent:pokemonTypes",
        "npc:pokemonTypes"
    ])
}

module.exports.addMove = (data) => {
    return qredis.sadd("user:allowedMoves", data.name.toLowerCase())
        .then((addReturned) => {
            return qredis.hmset("move:" + data.name.toLowerCase(), {
                "power": data.power,
                "type": moves.getMoveType(data.name.toLowerCase())
            })
        })
}


module.exports.addMoveOpponent = (data) => {
    return qredis.sadd("opponent:allowedMoves", data.name.toLowerCase())
        .then((addReturned) => {
            return qredis.hmset("move:" + data.name.toLowerCase(), {
                "power": data.power,
                "type": moves.getMoveType(data.name.toLowerCase())
            })
        })
}

module.exports.addMoveNPC = (data) => {
    return qredis.sadd("npc:allowedMoves", data.name.toLowerCase())
        .then((addReturned) => {
            return qredis.hmset("move:" + data.name.toLowerCase(), {
                "power": data.power,
                "type": moves.getMoveType(data.name.toLowerCase())
            })
        })
}

module.exports.setUserPokemonTypes = (typeArray) => {
    if (typeArray[1]) {
        return qredis.sadd("user:pokemonTypes", typeArray[0], typeArray[1]);
    } else {
        return qredis.sadd("user:pokemonTypes", typeArray[0]);
    }
}

module.exports.setOpponentPokemonTypes = (typeArray) => {
    if (typeArray[1]) {
        return qredis.sadd("opponent:pokemonTypes", typeArray[0], typeArray[1]);
    } else {
        return qredis.sadd("opponent:pokemonTypes", typeArray[0]);
    }
}

module.exports.setNpcPokemonTypes = (typeArray) => {
    if (typeArray[1]) {
        return qredis.sadd("npc:pokemonTypes", typeArray[0], typeArray[1]);
    } else {
        return qredis.sadd("npc:pokemonTypes", typeArray[0]);
    }
}

module.exports.getUserPokemonTypes = () => {
    return qredis.smembers("user:pokemonTypes")
}

module.exports.getOpponentsPokemonTypes = () => {
    return qredis.smembers("opponents:pokemonTypes")
}

module.exports.getNpcPokemonTypes = () => {
    return qredis.smembers("npc:pokemonTypes")
}

module.exports.getUserAllowedMoves = () => {
    return qredis.smembers("user:allowedMoves")
}

module.exports.getOpponentAllowedMoves = () => {
    return qredis.smembers("opponent:allowedMoves")
}

module.exports.getNpcAllowedMoves = () => {
    return qredis.smembers("npc:allowedMoves")
}

module.exports.getNpcAllowedMoves = () => {
    return qredis.smembers("npc:allowedMoves")
}

module.exports.setUserHP = (hp) => {
    return QRedis.set("user:hp", hp);
}

module.exports.getUserHP = () => {
    return QRedis.get("user:hp");
}

module.exports.setOpponentHP = (hp) => {
    return QRedis.set("opponent:hp", hp);
}

module.exports.getOpponentHP = () => {
    return QRedis.get("opponent:hp");
}

module.exports.setNpcHP = (hp) => {
    return QRedis.set("npc:hp", hp);
}

module.exports.getNpcHP = () => {
    return QRedis.get("npc:hp");
}

module.exports.doDamageToUser = (damage) => {
    return QRedis.decrby("user:hp", damage);
}

module.exports.doDamageToOpponent = (damage) => {
    return QRedis.decrby("opponent:hp", damage);
}

module.exports.doDamageToNpc = (damage) => {
    return QRedis.decrby("npc:hp", damage);
}


module.exports.getSingleMove = (moveName) => {
    return qredis.hgetall("move:"+moveName.toLowerCase())
}

