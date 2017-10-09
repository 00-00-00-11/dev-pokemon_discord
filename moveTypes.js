const fs = require('fs')

module.exports.getMoveType = (move) => {
    moveName = moveName.replace("-", " ")
    let data = fs.readFileSync("./moves.json")
    data = JSON.parse(data) 
    data = data.filter((val, index, arr) => {
        return Object.keys(val)[0] == moveName
    })
    if (data.length > 0) {
        return data[0][moveName]
    } else {
        return " "
    }
}