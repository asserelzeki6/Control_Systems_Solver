import { e, number, sum } from 'mathjs';
import { createRequire } from 'module';
import { python } from 'pythonia';

const require = createRequire(import.meta.url);


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

const getRoots = async (coeff) => {
    
    const np =  await python('numpy');
    const r = await np.roots(coeff);

    return r.toString().replace("array([","").replace("])","");replace("\n","")
}

const getRootsArray = (poles) =>{
    let output = [];
    for (let i = 0; i < poles.length; i++) {
        output[i] = [];
        output[i][1] = Number(poles[i].split("|")[0]);
        output[i][2] = Number(poles[i].split("|")[1]);
        

        if(Math.abs(output[i][1]) < 1e-10) output[i][1] = 0;
        if(Math.abs(output[i][2]) < 1e-10) output[i][2] = 0;

        output[i][0] = (output[i][1] > 0);

        if(output[i][1] === 0 && output[i][2] !== 0 ) output[i][1] = "";
        else output[i][1] = String(output[i][1]) ;

        if(output[i][2] > 0 ) {
            
            if(output[i][1] !== "") output[i][1] += "+";

            if(output[i][2] !== 1) output[i][1] += String(output[i][2]) + "i";
            else output[i][1] +=   "i";
        }
        else if(output[i][2] < 0 ){
            if(output[i][2] !== -1) output[i][1] += String(output[i][2]) + "i";
            else output[i][1] += "-" +  "i";
        }

        output[i].pop();
    }
    return output
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
const routh = async (equ) =>{

    let c = pasre(equ);
    console.log(c);

    let p = undefined;
    await getRoots(c).then(r => p = r);
    console.log(p);
    
    p = p.replace(/\n+|\ +/g,"");
    p = p.replace(/(\+|\-|)(\d+)(\.|)(\ +|)(\d+|)(\e(\+|\-)\d+|)((\+|\-)(\d+)(\.|)(\d+|)(\j)|)/g," $1$2$3$5$6|$9$10$11$12 ").split(",");

    p = getRootsArray(p);

    console.log(p);

    let output = {
        degree: c.length-1,
        coeff: c,
        table:routhFinalTable(routhInitalTable(c),c.length-1),
        poles: p,
        noPostivePoles: 0,
        stabiltyCheck : 0,
        isStabile: true
    }

    output.stabiltyCheck = routhStability(output.table);
    output.isStabile = (output.stabiltyCheck === 0)
    for (let i = 0; i < p.length; i++) {
        output.noPostivePoles += p[i][0];        
    }

    // console.log(output);
    python.exit();
    return output ;
    
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

let output = {};
await routh(test2).then(r => output = r);
console.log(output);



// for (let i = 0; i < test1.length; i++) {
    // let poles = undefined;
    // await getRoots(test1[i]).then(r => poles = r);
    // poles = poles.replace(/\n+|\ +/g,"");
    // poles = poles.replace(/(\+|\-|)(\d+)(\.|)(\ +|)(\d+|)(\e(\+|\-)\d+|)((\+|\-)(\d+)(\.|)(\d+|)(\j)|)/g," $1$2$3$5$6|$9$10$11$12 ").split(",");
    // console.log(poles);
    // console.log(getRootsArray(poles));
// }

// python.exit();
// process.exit();

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


