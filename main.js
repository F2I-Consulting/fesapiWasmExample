import FesapiModule from './fesapi.wasm.mjs';

let beginLoad = Date.now();

const Fesapi =  await FesapiModule({
    
    preRun: function() {    
        document.getElementById("status").innerHTML = "Initializing WebAssembly...";
        for (let k in FesapiModule) ignoredDefinitions.add(k);        
    },
      
    postRun: function() {        
        document.getElementById("status").innerHTML = "Ready.";
        document.getElementById("form").hidden = false;
        for (let k in FesapiModule)
          if (!(k in window) && !ignoredDefinitions.has(k))
            window[k] = FesapiModule[k];
            appendHtml(`<p>Welcome to <a href="https://github.com/F2I-Consulting/fesapi/">Fesapi</a>.  Loading took ${Date.now() -
    beginLoad}ms.</p`);
    },

    print: function (e) {
        //std::cout redirects to here
        console.log(e);
    },

    // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
    // You can omit locateFile completely when running in node
    locateFile: file => './fesapi.wasm.wasm'
});






const UPLOADED_FILES = [];

function cF64Array(size) {
  var offset = Fesapi._malloc(size * 8);
  Fesapi.HEAPF64.set(new Float64Array(size), offset / 8);
  return {
      "data": Fesapi.HEAPF64.subarray(offset / 8, offset / 8 + size),
      "offset": offset
  }
}

function test_fesapi() {

  let local_file = UPLOADED_FILES[0];

  appendHtml(local_file);
  let repo = new Fesapi.DataObjectRepository();
  if(repo.getDefaultEmlVersion() == Fesapi.EnergisticsStandard.EML2_3) {
    appendHtml('EML2_3');
  }
  else {
    appendHtml('Other version');
  }

  let epc_doc = new Fesapi.EpcDocument(local_file);
  let res = epc_doc.deserializeInto(repo, Fesapi.openingMode.READ_ONLY);
  appendHtml(res);
  // epc_doc.close();
  var uuids = repo.getUuids();
  for (let i = 0; i < uuids.size(); i++)
  {
    appendHtml(uuids.get(i));
  }          

  appendHtml("Faults")
  let faultSet = repo.getFaultSet();
  for (let i = 0; i < faultSet.size(); i++)
  {
    appendHtml(faultSet.get(i).getTitle());
  }

  // try {
  //   let faultCount = repo.getFaultCount();    
  // } catch(exception) {
  //   console.error(Fesapi.getExceptionMessage(exception))
  // } finally {
  //   for (let i = 0; i < faultCount; i++)
  //   {
  //     appendHtml(repo.getFault(i).getTitle());
  //   }
  // }

  var hdfProxyCount = repo.getHdfProxyCount();
  appendHtml('There are ' + hdfProxyCount + ' hdf files associated to this epc document.');

  for (let hdfProxyIndex = 0; hdfProxyIndex < hdfProxyCount; ++hdfProxyIndex) 
  {
    appendHtml('Hdf file relative path : ' + repo.getHdfProxy(hdfProxyIndex).getRelativePath());
  }

  for (let warningIndex = 0; warningIndex < repo.getWarnings().size(); ++warningIndex) 
  {
    appendHtml('Warning #' + warningIndex + ' : ' + repo.getWarnings().get(warningIndex));
  }

  for (let i = 0; i < repo.getFaultPolylineSetRepresentationCount(); i++)
  {
    var faultPolyRep = repo.getFaultPolylineSetRepresentation(i);
    appendHtml(typeof faultPolyRep);
    appendHtml('Fault PolylineSet name: ' + faultPolyRep.getTitle());
    var nodeCount = faultPolyRep.getXyzPointCountOfAllPatches();
    appendHtml('node Count: ' + nodeCount);
    //var allXyzPoints = cF64Array(parseInt(nodeCount) * 3);        
    //let allXyzPoints = new Float64Array(parseInt(nodeCount) * 3);
    let allXyzPoints = new Fesapi.vectorDouble();
    allXyzPoints.resize(parseInt(nodeCount) * 3, 1.);
    faultPolyRep.getXyzPointsOfAllPatchesInGlobalCrs(allXyzPoints);
    for (let i = 0; i < allXyzPoints.size(); ++i) 
    {
      appendHtml('value #' + i + ' : ' + allXyzPoints.get(i));
    }

    allXyzPoints.delete();
  }


}

function copyFiles(file){
  return new Promise(function(resolve, reject){
    let reader = new FileReader();
    let datafilename = file.name;

    reader.onloadend = function(evt){
      let data = evt.target.result;
      Fesapi.FS.writeFile(datafilename, new Uint8Array(data));
                    
        if (!UPLOADED_FILES.includes(datafilename)) {
            UPLOADED_FILES.push(datafilename);
            console.log("file loaded:", datafilename);
        }
        else {
            console.log("file updated: ", datafilename)
        }
        resolve(reader.result);
    };

    reader.onerror = function(){
        reject(reader);
    };

    reader.readAsArrayBuffer(file);
  });
}

function uploader() {
  let files = this.files;
  let readers = [];

  // Abort if there were no files selected
  if(!files.length) return;

  // Store promises in array
  for(let i = 0;i < files.length;i++){
      readers.push(copyFiles(files[i]));
  }
  
  // Trigger Promises
  Promise.all(readers).then((values) => {
      console.log(values);
      test_fesapi();          
  });
}


document.getElementById("input").onchange = uploader;  



// this['Fesapi'] = Module;

// let moduleInstance = null;
// let ignoredDefinitions = new Set();

// const Module_fesapi = {
//     preRun: (Module) => {
//         document.getElementById("status").innerHTML = "Initializing WebAssembly...";
//         for (let k in Module) {
//             ignoredDefinitions.add(k);  
//             addTextToBody(k);
//         }
//     },
//     // locateFile: file => './fesapi.wasm.wasm'
// };

// if (moduleInstance === null) {
//     new Fesapi(Module_fesapi).then(myModule => {
//         moduleInstance = myModule;
//     });
// }

// console.log(moduleInstance)


// async function main(input1, input2){


    
//     const Module = await Fesapi(Module_fesapi)
//     // Module.FS.writeFile('first_input.txt', input1)
//     // Module.FS.writeFile('second_input.txt', input2)
//     // Module.callMain(['-r', 'first_input.txt', '-q', 'second_input.txt', '-o', 'test.out', '-t', '1'])
//     // const output = Module.FS.readFile('test.out', { encoding: 'utf8' })
//     console.log("plop")
// }


// export default main


// Fesapi().then(Module_ =>
// {
//     console.log("plop")
// });


// console.log(typeof Fesapi);

// const Fesapi =  await Fesapi({
//       // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
//       // You can omit locateFile completely when running in node
//       locateFile: file => './dist/fesapi.wasm.wasm'
//     });

// // var config = {
// //   locateFile: () => './dist/fesapi.wasm.wasm'
// // }

// Fesapi(config).then(function(Fesapi) {
//     addTextToBody("plop")
// });


export function appendHtml(text) {
    const tag = document.createElement('div');
    tag.innerHTML = text;
    document.body.appendChild(tag);
}


// Fesapi["preRun"] = (function() {
//     document.getElementById("status").innerHTML = "Initializing WebAssembly...";
//     for (let k in Fesapi) ignoredDefinitions.add(k);  
    
//     console.log("Initializing WebAssembly")
// })


// let beginLoad = Date.now();  
// console.log(beginLoad)  
// let $ = document.getElementById.bind(document);

// let appendHtml = (container, html) => {
//   let e = document.createElement(container);
//   e.innerHTML = html
//   document.getElementById("log").appendChild(e);
// };
// let defCount = 0;
// let ignoredDefinitions = new Set();

// var app = new Fesapi(config, {

//     preRun: function() {
//         document.getElementById("status").innerHTML = "Initializing WebAssembly...";
//         for (let k in Module) ignoredDefinitions.add(k);        
//     },
      
//     postRun: function() {        
//         document.getElementById("status").innerHTML = "Ready.";
//         document.getElementById("form").hidden = false;
//         for (let k in Module)
//           if (!(k in window) && !ignoredDefinitions.has(k))
//             window[k] = Module[k];
//         appendHtml('p', `Welcome to <a href="https://github.com/F2I-Consulting/fesapi/">Fesapi</a>.  Loading took ${Date.now() -
//     beginLoad}ms.`);        
//     },

//     print: function (e) {
//         //std::cout redirects to here
//         console.log(e);
//     }
// });

// Fesapi(config).then(function(Fesapi) {

//     Fesapi.preRun = function() {
//           document.getElementById("status").innerHTML = "Initializing WebAssembly...";
//           for (let k in Fesapi) ignoredDefinitions.add(k);  
          
//           console.log("Initializing WebAssembly")
//     }

//     Fesapi.postRun = function() {
          
//           document.getElementById("status").innerHTML = "Ready.";
//           document.getElementById("form").hidden = false;
//           for (let k in Fesapi)
//             if (!(k in window) && !ignoredDefinitions.has(k))
//               window[k] = Fesapi[k];
//         //   appendHtml('p', `Welcome to <a href="https://github.com/F2I-Consulting/fesapi/">Fesapi</a>.  Loading took ${Date.now() -
//     //   beginLoad}ms.`);  
//         console.log("Welcome")      
//     }

// });

// console.log(app)
