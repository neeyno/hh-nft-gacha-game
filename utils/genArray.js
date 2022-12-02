//const chancesArray = [5, 65, 625] //[625, 65, 5, 0]
const fs = require("fs")

function genArray(inputArray) {
    const lastIndex = inputArray.length - 1
    let array = []
    let index = 0

    for (let i = 0; i < inputArray[lastIndex]; ) {
        if (i < inputArray[index]) {
            array.push(index)
        } else {
            ++index
            array.push(index)
        }
        ++i
    }
    console.log(array.length)
    console.log(array[inputArray[lastIndex] - 1])
    return array
    //fs.writeFileSync(`./idArray.json`, JSON.stringify(array))
}

module.exports = { genArray }
//genArray()
//.then(() => process.exit(0))
// .catch((error) => {
//     console.error(error)
//     process.exit(1)
// })
