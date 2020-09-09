
const averageFunc = (array) => {

const reducer = (accumulator, currentValue) => accumulator + currentValue;
const sum = array.reduce(reducer)
const avg = sum/array.length;

return avg.toFixed(8);

}


module.exports = averageFunc;


