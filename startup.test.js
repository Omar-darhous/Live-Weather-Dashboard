import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('startup requests Cairo weather and wires search to autocomplete', async () => {
  const elements = new Map();
  const node = () => ({value:'',dataset:{},hidden:true,append(){},after(){},before(){},prepend(){},setAttribute(){},querySelector(){return node();}});
  const get = selector => {if(!elements.has(selector))elements.set(selector,node());return elements.get(selector);};
  const requests = [], searches = [];
  let configuration;
  const context = vm.createContext({
    document:{querySelector:get,querySelectorAll:()=>[],createElement:node,createTextNode:text=>text,body:node()},
    sessionStorage:{getItem:()=>null},AbortController,
    setupCitySearch:options=>{configuration=options;return {close(){},search:query=>searches.push(query)};},
    getWeather:async city=>{requests.push(city);throw new Error('Test network failure');},
  });
  const source=(await readFile(new URL('./script.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
  await vm.runInContext(source,context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests.length,1);
  assert.equal(requests[0].name,'Cairo');
  assert.equal(get('#error').hidden,false);
  assert.equal(get('#status').hidden,true);
  assert.equal(configuration.input,get('#city-input'));
  assert.equal(configuration.getKey(),'');
  get('#city-input').value='Lo';
  get('#search-form').onsubmit({preventDefault(){}});
  assert.deepEqual(searches,['Lo']);
  configuration.onSelect({name:'London',lat:51.5,lon:-.1});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests[1].name,'London');
});
