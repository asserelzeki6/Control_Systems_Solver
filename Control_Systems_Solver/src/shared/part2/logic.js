import { e, number, sum } from 'mathjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// nerdamer
var nerdamer = require("nerdamer/all.min")

// initial table
const routhInitalTable = (coff) => {
    let table = [];
    table[0] = [];
    table[1] = [];
    let c = 0, j = 0;
    for (; c < coff.length; j++) {
        table[0][j] = coff[c];
        if(c === coff.length-1) {
            table[1][j] = 0;
            break;
        }
        table[1][j] = coff[c+1];
        c+=2;
    }
    return table ;
}

/**
 * multiplai
 * 
 * input (table ,[a,b])
 * (([a-1,b] * [a-2,b+1]) - ([a-2,b] * [a-1,b+1]))/([a-1,b])
 */

const getElement = (t, [a,b]) => {
    let e = 1e-12;
    // if(t[a-2][b+1] === 0) return 0;
    if(t[a-1][0] === 0) return ((e * t[a-2][b+1]) - (t[a-2][b] * t[a-1][b+1]))/ e;
    return ((t[a-1][0] * t[a-2][b+1]) - (t[a-2][0] * t[a-1][b+1]))/(t[a-1][0]);
}

const checkZeroRow = (r) =>{
    if(r.length < 3) return false;
    for (let i = 0; i < r.length; i++)
        if(r[i] != 0) return false;
    return true;
}

const zeroRow = (r , d) =>{
    let output = [];
    let i = 0;
    for (; i < r.length; i++) {
        if((d - 2*i) <= 0){
            output[i] = 0;
        }
        else
            output[i] = r[i] * (d - 2*i);
    }
    output[i] = 'z';
    return output;
}

// final table
const routhFinalTable = (table , degree) =>{
    for (let i = 0; i < degree-1; i++) {
        table[2+i] = [];
        if(checkZeroRow(table[1+i]) && degree-i > 2 ){
            table[1+i] = zeroRow(table[i], degree - i) ;
        }
        for (let j = 0; true; j++) {
            if(j == table[1].length-1){
                table[2+i][j] = 0;
                break;
            }

            // let e = getElement(table,[2+i, j]);
            // if(e === 0 && j === 0) e = 1e-12;

            table[2+i][j] = getElement(table,[2+i, j]);;
        }
    }
    return table;
}

// stability check
/**
 * if output = 0 --> system is stable
 * if output > 0 --> system is unstable and number of postive poles at least = output;
 * if output = -1 --> system unstable, number of postive poles at least 1.
 */

const routhStability = (table) =>{
    let stabilty = 0;

    let zero = false;
    for(let i = 1; i < table.length; i++) {
        if(table[i-1][0] === 0){
            if(table[i-2][0] * table[i][0] < 0) stabilty++;
        }
        if(table[i-1][0] * table[i][0] < 0) stabilty++;
        if(table[i-1][0] * table[i][0] === 0) zero = true;
    }
    if(zero) stabilty*=-1;
    if(zero && stabilty === 0) return -1;
    return stabilty;
}


// get roots

const getEqu = (coff) =>{
    let output = '';
    for (let i = 0; i < coff.length; i++) {
        output += coff[i].toString();
        if(i < coff.length-1){
            output += '*x^';
            output += (coff.length-1-i).toString();
            output += '+';
        }
    }
    return output;
}

const postivePoles = (x) =>{
    let output = [];
    output[0] = [];
    output[1] = x.toString().replace("[",'').replace("]",'').split(",");
    x = x.toString().replace(/(\+|\-|)((\((\-|)\d+\/\d+\))|(\d+(\.\d+|)))\*\i/g,"");
    x = x.replace("[",'').replace("]",'').split(",");
    for (let i = 0; i< x.length; i++) {
        output[0][i] = !(x[i][0] === '-');
    }
    return output;
}

// pasre eqution

const pasre = (equ) =>{
    equ = equ.replace(/((\+|\-|)(\d+|)(\.\d+|))(\*|)([A-z](\^|)(\d+|))/g ,  " $1|$8 &");
    equ = equ.split("&");
    let coeff = [];
    for (let i = 0; i < equ.length; i++) {
        let c = equ[i].split("|")[0];
        let p = equ[i].split("|")[1];
        
        if(c.search(/(\+|\-|)\d+/g) !== -1) c = Number(c);
        else if(c.search(/\+/g) !== -1) c = 1;
        else if(c.search(/\-/g) !== -1)c = -1;
        else c = 1;

        if(p === undefined) p = 0;
        else if(p.search(/\d+/g) !== -1) p = Number(p);
        else p = 1

        coeff[p] = c;
    }

    coeff.forEach(e =>{ if(e === undefined) e = 0});

    return coeff.reverse();
}


// object 
const routh = (equ) =>{

    let c = pasre(equ);

    let output = {
        degree: c.length-1,
        coff: c,
        table:routhFinalTable(routhInitalTable(c),c.length-1),
        poles: postivePoles(nerdamer.solve(getEqu(c),'x')),
        noPostivePoles: 0,
        stabiltyCheck : 0,
        isStabile: true
    }

    output.stabiltyCheck = routhStability(output.table);
    output.noPostivePoles = (sum(output.poles[0]) > output.stabiltyCheck)? sum(output.poles[0]):output.stabiltyCheck ;
    output.isStabile = (output.stabiltyCheck === 0)


    return output;
}

// test

let test1 = [[1,1,10,72,152,240],
            [1,2,1,2],
            [1,2,2,4,11,10],
            [3,5,6,3,2,1],
            [1,2,3,6,5,3],
            [1,2,4,8],
            [1,1,2,2,1,1],
            [1,2,24,48,-25,-50],
            [1,1,-3,-1,2],
            [1,1,-2,-3,-7,-4,-4],
            [1,1,-2,-3,-7,-4,-4],
            [1,3,3,2,1]];



let test2 = "s^5+s^4+10s^3+72s^2+152s+240";

let output = routh(test2);
console.log(output);

// for (let j = 0; j < test.length; j++) {
//     console.log(test[j]);

//     let output = routh(test[j]);
//     console.log("--------------------------------------------");
//     console.log(output)

//     // let stability = routhStability(output);
//     // if(output.isStabile) console.log(true);
//     // else console.log(false, output.stabiltyCheck);

//     // console.log("no. postive poles:", output.noPostivePoles);
//     // console.log("roots:")
//     // console.log(output.poles);
//     console.log("--------------------------------------------");
// }


